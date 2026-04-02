import React, { useRef, useState } from 'react';
import { Template } from '../types';
import { Plus, X } from 'lucide-react';
import { extractVariables } from '../utils/templateParser';
import Modal from './Modal';

interface TemplateEditorProps {
  template: Template;
  onChange: (template: Template) => void;
}

export default function TemplateEditor({ template, onChange }: TemplateEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [newVarName, setNewVarName] = useState('');
  const [deleteVarConfirm, setDeleteVarConfirm] = useState<string | null>(null);

  const handleInsertVariable = (varName: string = newVarName, isSmartInsert: boolean = false) => {
    if (!varName.trim()) return;
    const cleanVarName = varName.trim();
    const textarea = textareaRef.current;

    if (isSmartInsert) {
      const lines = template.content.split('\n');
      let insertIndex = -1;
      
      // Find the "参考链接" line as the anchor point
      const refIndex = lines.findIndex(l => l.includes('参考链接'));
      if (refIndex !== -1) {
        insertIndex = refIndex;
        // Keep going down as long as lines look like variable definitions
        while (
          insertIndex + 1 < lines.length && 
          lines[insertIndex + 1].trim() !== '' && 
          lines[insertIndex + 1].includes('{{') && 
          lines[insertIndex + 1].includes('}}')
        ) {
          insertIndex++;
        }
      } else {
        // Fallback: find the first contiguous block of variables
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes('{{') && lines[i].includes('}}')) {
            insertIndex = i;
            while (
              insertIndex + 1 < lines.length && 
              lines[insertIndex + 1].trim() !== '' && 
              lines[insertIndex + 1].includes('{{') && 
              lines[insertIndex + 1].includes('}}')
            ) {
              insertIndex++;
            }
            break;
          }
        }
      }

      const smartString = `${cleanVarName}：{{${cleanVarName}}}`;

      if (insertIndex !== -1) {
        lines.splice(insertIndex + 1, 0, smartString);
        onChange({ ...template, content: lines.join('\n') });
      } else {
        const prefix = template.content && !template.content.endsWith('\n') ? '\n' : '';
        onChange({ ...template, content: template.content + prefix + smartString });
      }
      if (varName === newVarName) setNewVarName('');
      return;
    }

    // Standard insert at cursor
    const varString = `{{${cleanVarName}}}`;
    
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = 
        template.content.substring(0, start) + 
        varString + 
        template.content.substring(end);
      
      onChange({ ...template, content: newContent });
      
      if (varName === newVarName) setNewVarName('');
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + varString.length, start + varString.length);
      }, 0);
    } else {
      onChange({ ...template, content: template.content + varString });
      if (varName === newVarName) setNewVarName('');
    }
  };

  const handleDeleteVariable = (varName: string) => {
    setDeleteVarConfirm(varName);
  };

  const confirmDeleteVariable = () => {
    if (deleteVarConfirm) {
      const varString = `{{${deleteVarConfirm}}}`;
      const newContent = template.content
        .split('\n')
        .filter(line => !line.includes(varString))
        .join('\n');
      
      onChange({ ...template, content: newContent });
      setDeleteVarConfirm(null);
    }
  };

  const existingVars = extractVariables(template.content);

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-100 bg-slate-50 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">模板名称</label>
          <input
            type="text"
            value={template.name}
            onChange={(e) => onChange({ ...template, name: e.target.value })}
            placeholder="输入模板名称..."
            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">添加新变量</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newVarName}
              onChange={(e) => setNewVarName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleInsertVariable(newVarName, true)}
              placeholder="输入变量名 (如: 公司地址)"
              className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-sm"
            />
            <button
              onClick={() => handleInsertVariable(newVarName, true)}
              disabled={!newVarName.trim()}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition-colors text-sm shadow-sm"
              title="自动格式化为 '变量名：{{变量名}}' 并添加到变量列表中"
            >
              <Plus size={16} />
              添加
            </button>
          </div>
          {existingVars.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2 items-center">
              <span className="text-xs text-slate-500">已有变量:</span>
              {existingVars.map(v => (
                <div key={v} className="inline-flex items-center bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
                  <button
                    onClick={() => handleInsertVariable(v, false)}
                    className="text-xs px-2 py-1 text-slate-600 hover:bg-slate-50 transition-colors"
                    title="将该变量插入到光标处"
                  >
                    {v}
                  </button>
                  <button
                    onClick={() => handleDeleteVariable(v)}
                    className="px-1.5 py-1 text-slate-400 hover:text-red-500 hover:bg-red-50 border-l border-slate-200 transition-colors"
                    title={`删除变量 ${v}`}
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="flex-1 p-4 flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-slate-700">模板内容</label>
          <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
            使用 {"{{变量名}}"} 语法定义变量
          </span>
        </div>
        <textarea
          ref={textareaRef}
          value={template.content}
          onChange={(e) => onChange({ ...template, content: e.target.value })}
          placeholder="在此输入提示词模板内容...&#10;例如：帮我写一篇关于 {{主题}} 的文章。"
          className="flex-1 w-full p-4 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none font-mono text-sm leading-relaxed"
        />
      </div>

      <Modal
        isOpen={deleteVarConfirm !== null}
        title="删除变量"
        message={`确定要从模板中移除变量 "{{${deleteVarConfirm}}}" 吗？包含该变量的整行文本都将被删除。`}
        onConfirm={confirmDeleteVariable}
        onCancel={() => setDeleteVarConfirm(null)}
        confirmText="删除"
      />
    </div>
  );
}
