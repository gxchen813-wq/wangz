import { collection, doc, setDoc, getDocs, getDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db, auth } from './firebase';
import { Template } from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const DEFAULT_TEMPLATES: Template[] = [
  {
    id: '1',
    name: '游戏官网生成提示词',
    content: `你是一个资深的前端开发工程师和UI设计师。请帮我生成一个游戏官网的HTML/CSS代码。

游戏名称：{{游戏名称}}
游戏类型：{{游戏类型}}
美术风格：{{美术风格}}
公司名称：{{公司名称}}
联系邮箱：{{联系邮箱}}
参考链接：{{参考链接}}
公司地址：{{公司地址}}

要求：
1. 页面包含导航栏、首屏大图（Hero Section）、游戏特色介绍、新闻公告、页脚。
2. 整体色调符合{{美术风格}}的风格。
3. 响应式设计，适配移动端。
4. 请直接输出代码，不要多余的解释。`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: '2',
    name: '小红书爆款文案',
    content: `请帮我写一篇小红书爆款文案。

主题：{{主题}}
产品/景点名称：{{名称}}
核心卖点：{{核心卖点}}
目标人群：{{目标人群}}
语气风格：{{语气风格}}

要求：
1. 标题要吸引人，带有Emoji，字数在20字以内。
2. 正文分段清晰，多用Emoji作为列表符号。
3. 突出{{核心卖点}}，直击{{目标人群}}的痛点。
4. 结尾包含互动引导（如：点赞、收藏、评论）。
5. 附带5-8个相关的话题标签（Hashtags）。`,
    createdAt: Date.now() - 1000,
    updatedAt: Date.now() - 1000,
  }
];

export async function getTemplates(): Promise<Template[]> {
  const user = auth.currentUser;
  if (!user) return [];

  try {
    const q = query(collection(db, 'templates'), where('userId', '==', user.uid));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      // Create defaults for this user
      for (const t of DEFAULT_TEMPLATES) {
        await saveTemplate({ ...t, id: crypto.randomUUID() });
      }
      return getTemplates(); // Re-fetch
    }
    
    const templates: Template[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      templates.push({
        id: doc.id,
        name: data.name,
        content: data.content,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      });
    });
    
    // Sort by updatedAt descending
    return templates.sort((a, b) => b.updatedAt - a.updatedAt);
  } catch (e) {
    handleFirestoreError(e, OperationType.LIST, 'templates');
    return [];
  }
}

export async function saveTemplate(template: Template) {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  try {
    const templateDoc = doc(db, 'templates', template.id);
    const data = {
      userId: user.uid,
      name: template.name,
      content: template.content,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    };
    
    await setDoc(templateDoc, data, { merge: true });
  } catch (e) {
    handleFirestoreError(e, OperationType.WRITE, `templates/${template.id}`);
  }
}

export async function deleteTemplate(id: string) {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  try {
    await deleteDoc(doc(db, 'templates', id));
  } catch (e) {
    handleFirestoreError(e, OperationType.DELETE, `templates/${id}`);
  }
}
