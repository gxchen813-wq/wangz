import { Template } from '../types';

const STORAGE_KEY = 'prompt_templates';

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

export function getTemplates(): Template[] {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    saveTemplates(DEFAULT_TEMPLATES);
    return DEFAULT_TEMPLATES;
  }
  try {
    let templates: Template[] = JSON.parse(data);
    
    // Auto-fix for the formatting issue where {{公司地址}} was appended directly
    let hasChanges = false;
    templates = templates.map(t => {
      if (t.content.includes('{{参考链接}}{{公司地址}}')) {
        t.content = t.content.replace(
          '{{参考链接}}{{公司地址}}', 
          '{{参考链接}}\n公司地址：{{公司地址}}'
        );
        hasChanges = true;
      }
      return t;
    });

    if (hasChanges) {
      saveTemplates(templates);
    }

    return templates;
  } catch (e) {
    return DEFAULT_TEMPLATES;
  }
}

export function saveTemplates(templates: Template[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
}
