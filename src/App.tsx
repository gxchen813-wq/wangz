import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Edit2, Trash2, Save, X, FileText, Search, MessageSquareQuote } from 'lucide-react';
import { Template } from './types';
import { getTemplates, saveTemplates } from './utils/storage';
import { fillTemplate } from './utils/templateParser';
import VariableForm from './components/VariableForm';
import PromptPreview from './components/PromptPreview';
import TemplateEditor from './components/TemplateEditor';
import Modal from './components/Modal';

export default function App() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'alert' | 'confirm';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'alert',
    onConfirm: () => {},
  });

  const showAlert = (title: string, message: string) => {
    setModalConfig({
      isOpen: true,
      title,
      message,
      type: 'alert',
      onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
    });
  };

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setModalConfig({
      isOpen: true,
      title,
      message,
      type: 'confirm',
      onConfirm: () => {
        onConfirm();
        setModalConfig(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  useEffect(() => {
    const loaded = getTemplates();
    setTemplates(loaded);
    if (loaded.length > 0) {
      setSelectedId(loaded[0].id);
    }
  }, []);

  const selectedTemplate = useMemo(() => 
    templates.find(t => t.id === selectedId) || null
  , [templates, selectedId]);

  const filteredTemplates = useMemo(() => 
    templates.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()))
  , [templates, searchQuery]);

  const handleSelectTemplate = (id: string) => {
    if (isEditing) {
      showConfirm('未保存更改', '有未保存的更改，确定要切换吗？', () => {
        setIsEditing(false);
        setSelectedId(id);
        setVariableValues({});
      });
      return;
    }
    setSelectedId(id);
    setVariableValues({});
  };

  const handleCreateTemplate = () => {
    const newTemplate: Template = {
      id: Date.now().toString(),
      name: '新模板',
      content: '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setEditingTemplate(newTemplate);
    setSelectedId(newTemplate.id);
    setIsEditing(true);
    setVariableValues({});
  };

  const handleEditTemplate = () => {
    if (selectedTemplate) {
      setEditingTemplate({ ...selectedTemplate });
      setIsEditing(true);
    }
  };

  const handleSaveTemplate = () => {
    if (!editingTemplate) return;
    
    if (!editingTemplate.name.trim()) {
      showAlert('提示', '请输入模板名称');
      return;
    }

    let newTemplates;
    const exists = templates.some(t => t.id === editingTemplate.id);
    
    if (exists) {
      newTemplates = templates.map(t => 
        t.id === editingTemplate.id ? { ...editingTemplate, updatedAt: Date.now() } : t
      );
    } else {
      newTemplates = [{ ...editingTemplate, updatedAt: Date.now() }, ...templates];
    }

    setTemplates(newTemplates);
    saveTemplates(newTemplates);
    setIsEditing(false);
    setEditingTemplate(null);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingTemplate(null);
    // If it was a new unsaved template, select the first available one
    if (!templates.some(t => t.id === selectedId)) {
      setSelectedId(templates.length > 0 ? templates[0].id : null);
    }
  };

  const handleDeleteTemplate = (id: string) => {
    showConfirm('删除模板', '确定要删除这个模板吗？此操作不可恢复。', () => {
      const newTemplates = templates.filter(t => t.id !== id);
      setTemplates(newTemplates);
      saveTemplates(newTemplates);
      if (selectedId === id) {
        setSelectedId(newTemplates.length > 0 ? newTemplates[0].id : null);
        setIsEditing(false);
      }
    });
  };

  const handleVariableChange = (key: string, value: string) => {
    setVariableValues(prev => ({ ...prev, [key]: value }));
  };

  const filledContent = selectedTemplate 
    ? fillTemplate(selectedTemplate.content, variableValues)
    : '';

  return (
    <div className="flex flex-col md:flex-row h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
      {/* Sidebar */}
      <div className="w-full md:w-80 h-1/3 md:h-full bg-white border-b md:border-b-0 md:border-r border-slate-200 flex flex-col z-10 shadow-sm shrink-0">
        <div className="p-5 border-b border-slate-100">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <MessageSquareQuote className="text-white" size={20} />
            </div>
            <h1 className="text-lg font-bold text-slate-800 tracking-tight">Prompt Manager</h1>
          </div>
          <button
            onClick={handleCreateTemplate}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors shadow-sm shadow-indigo-200"
          >
            <Plus size={18} />
            新建模板
          </button>
          <div className="mt-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="搜索模板..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {filteredTemplates.length === 0 ? (
            <div className="text-center text-slate-500 text-sm py-8">
              没有找到模板
            </div>
          ) : (
            filteredTemplates.map(template => (
              <div
                key={template.id}
                onClick={() => handleSelectTemplate(template.id)}
                className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${
                  selectedId === template.id
                    ? 'bg-indigo-50 border border-indigo-100 shadow-sm'
                    : 'hover:bg-slate-50 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <FileText size={16} className={selectedId === template.id ? 'text-indigo-600' : 'text-slate-400'} />
                  <span className={`truncate text-sm font-medium ${selectedId === template.id ? 'text-indigo-900' : 'text-slate-700'}`}>
                    {template.name}
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteTemplate(template.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-all"
                  title="删除模板"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50/50">
        {selectedTemplate || isEditing ? (
          <>
            {/* Header */}
            <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 shrink-0">
              <h2 className="text-xl font-semibold text-slate-800 truncate pr-4">
                {isEditing ? (editingTemplate?.name || '未命名模板') : selectedTemplate?.name}
              </h2>
              <div className="flex items-center gap-3 shrink-0">
                {isEditing ? (
                  <>
                    <button
                      onClick={handleCancelEdit}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <X size={16} />
                      取消
                    </button>
                    <button
                      onClick={handleSaveTemplate}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors shadow-sm shadow-indigo-200"
                    >
                      <Save size={16} />
                      保存模板
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleEditTemplate}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-lg transition-all shadow-sm"
                  >
                    <Edit2 size={16} />
                    编辑模板
                  </button>
                )}
              </div>
            </header>

            {/* Workspace */}
            <div className="flex-1 p-6 overflow-hidden">
              {isEditing && editingTemplate ? (
                <div className="h-full max-w-4xl mx-auto">
                  <TemplateEditor 
                    template={editingTemplate} 
                    onChange={setEditingTemplate} 
                  />
                </div>
              ) : selectedTemplate ? (
                <div className="h-full flex flex-col lg:flex-row gap-6">
                  {/* Left: Variables Form */}
                  <div className="w-full lg:w-1/3 flex flex-col min-h-0">
                    <VariableForm 
                      template={selectedTemplate}
                      values={variableValues}
                      onChange={handleVariableChange}
                    />
                  </div>
                  
                  {/* Right: Preview */}
                  <div className="w-full lg:w-2/3 flex flex-col min-h-0">
                    <PromptPreview content={filledContent} />
                  </div>
                </div>
              ) : null}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
            <div className="bg-white p-6 rounded-full shadow-sm border border-slate-100 mb-4">
              <MessageSquareQuote size={48} className="text-indigo-200" />
            </div>
            <p className="text-lg font-medium text-slate-600 mb-2">选择一个模板开始</p>
            <p className="text-sm">或者点击左侧的"新建模板"创建一个新的提示词模板</p>
          </div>
        )}
      </div>

      <Modal
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        onConfirm={modalConfig.onConfirm}
        onCancel={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
