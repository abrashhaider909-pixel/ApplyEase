import React, { useState } from 'react';
import { useApplyEaseStore } from '../../lib/store';
import { ApplicationType } from '../../types';
import {
  CalendarDays,
  UtensilsCrossed,
  FolderArchive,
  BookOpen,
  GraduationCap,
  ReceiptText,
  FileText,
  Clock,
  ArrowRight,
  ShieldCheck,
  Search
} from 'lucide-react';

interface ApplicationCatalogProps {
  onSelectType: (type: ApplicationType) => void;
}

export const ApplicationCatalog: React.FC<ApplicationCatalogProps> = ({ onSelectType }) => {
  const { applicationTypes } = useApplyEaseStore();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [search, setSearch] = useState('');

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'CalendarDays':
        return <CalendarDays className="w-5 h-5 text-[#f4772e]" />;
      case 'UtensilsCrossed':
        return <UtensilsCrossed className="w-5 h-5 text-[#f4772e]" />;
      case 'FolderArchive':
        return <FolderArchive className="w-5 h-5 text-[#f4772e]" />;
      case 'BookOpen':
        return <BookOpen className="w-5 h-5 text-[#f4772e]" />;
      case 'GraduationCap':
        return <GraduationCap className="w-5 h-5 text-[#f4772e]" />;
      case 'ReceiptText':
        return <ReceiptText className="w-5 h-5 text-[#f4772e]" />;
      default:
        return <FileText className="w-5 h-5 text-[#f4772e]" />;
    }
  };

  const categories = [
    { id: 'all', label: 'All Services' },
    { id: 'academic', label: 'Academic Affairs' },
    { id: 'hostel', label: 'Hostel & Residential' },
    { id: 'administrative', label: 'Administrative & Records' },
    { id: 'financial', label: 'Finance & Accounts' }
  ];

  const filteredTypes = applicationTypes.filter((t) => {
    if (!t.active) return false;
    if (selectedCategory !== 'all' && t.category !== selectedCategory) return false;
    if (
      search &&
      !t.title.toLowerCase().includes(search.toLowerCase()) &&
      !t.description.toLowerCase().includes(search.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Catalog Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            University Application & Service Catalog
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Choose an official service to initiate your dynamic digital submission. Forms are automatically routed to authorized department reviewers.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search service..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#172b50]"
          />
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedCategory(c.id)}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap shrink-0 ${
              selectedCategory === c.id
                ? 'bg-[#172b50] text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Grid of Available Application Types */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTypes.map((type) => {
          const feeReq = type.formConfig.feeRules.required;
          const stageCount = type.workflowDefinition.stages.length;

          return (
            <div
              key={type.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center shrink-0">
                    {getIcon(type.icon)}
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>~{type.estimatedDurationDays}d SLA</span>
                  </div>
                </div>

                <h3 className="text-base font-semibold text-slate-900 group-hover:text-[#172b50] transition-colors leading-snug">
                  {type.title}
                </h3>
                <p className="text-xs text-slate-500 mt-2 line-clamp-3 leading-relaxed">
                  {type.description}
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
                  <span>{stageCount} Workflow Stage{stageCount === 1 ? '' : 's'}</span>
                  <span>
                    {feeReq ? (
                      <span className="font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded text-[11px]">
                        Fee: ${type.formConfig.feeRules.amount}
                      </span>
                    ) : (
                      <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px]">
                        Free Service
                      </span>
                    )}
                  </span>
                </div>

                <button
                  onClick={() => onSelectType(type)}
                  className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-white bg-[#172b50] hover:bg-[#1f3763] rounded-lg transition-colors shadow-xs"
                >
                  <span>Apply Now</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
