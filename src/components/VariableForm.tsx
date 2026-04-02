import React from 'react';
import { Template } from '../types';
import { extractVariables } from '../utils/templateParser';

interface VariableFormProps {
  template: Template;
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
}

export default function VariableForm({ template, values, onChange }: VariableFormProps) {
  const variables = extractVariables(template.content);

  if (variables.length === 0) {
    return (
      <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-200 h-full flex items-center justify-center text-slate-500">
        此模板没有定义变量。
        <br />
        在模板中使用 {"{{变量名}}"} 语法来添加变量。
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-200 h-full overflow-y-auto">
      <h3 className="text-lg font-semibold text-slate-800 mb-6 flex items-center gap-2">
        <span className="bg-indigo-100 text-indigo-700 w-6 h-6 rounded-full flex items-center justify-center text-sm">
          {variables.length}
        </span>
        填写变量
      </h3>
      <div className="space-y-5">
        {variables.map((v) => (
          <div key={v}>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              {v}
            </label>
            <input
              type="text"
              value={values[v] || ''}
              onChange={(e) => onChange(v, e.target.value)}
              placeholder={`输入 ${v}`}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
