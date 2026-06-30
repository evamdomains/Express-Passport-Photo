import SectionAccordion from './SectionAccordion';
import RequirementCard, { type RequirementRule } from './RequirementCard';
import GovernmentTipBox from './GovernmentTipBox';
import AnimatedImageFrame from './AnimatedImageFrame';
import type { ExampleItem } from './ExampleCard';

export interface RequirementSectionData {
  index: number;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  /** Optional lead illustration shown (animated) when the section is expanded. */
  image?: string;
  description: string;
  doRules?: RequirementRule[];
  dontRules?: RequirementRule[];
  /** Single combined checklist (used when do/dont split doesn't apply). */
  checklistTitle?: string;
  checklist?: RequirementRule[];
  accepted: ExampleItem[];
  rejected: ExampleItem[];
  tips: string[];
  government: React.ReactNode;
  defaultOpen?: boolean;
}

/**
 * RequirementSection — one full expandable section: description, checklist(s),
 * accepted/rejected example gallery, helpful tips, and a government tip box.
 * Driven entirely by data so new sections (Background, Lighting, etc.) can be
 * added later without new markup.
 */
export default function RequirementSection({ data }: { data: RequirementSectionData }) {
  return (
    <SectionAccordion
      index={data.index}
      title={data.title}
      subtitle={data.subtitle}
      icon={data.icon}
      defaultOpen={data.defaultOpen}
    >
      {data.image && (
        <div className="mb-2">
          <AnimatedImageFrame src={data.image} alt={`${data.title} — passport photo examples`} />
        </div>
      )}

      <p className="text-gray-600 leading-relaxed max-w-3xl">{data.description}</p>

      {/* Checklists */}
      {data.checklist ? (
        <RequirementCard title={data.checklistTitle ?? 'Requirements'} tone="do" rules={data.checklist} />
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {data.doRules && <RequirementCard title="Allowed" tone="do" rules={data.doRules} />}
          {data.dontRules && <RequirementCard title="Not allowed" tone="dont" rules={data.dontRules} />}
        </div>
      )}

      {/* Tips */}
      <div className="rounded-2xl bg-gray-50 border border-gray-100 p-5">
        <h4 className="text-sm font-semibold text-gray-900 mb-2.5 flex items-center gap-2">
          <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3a6 6 0 0 0-3.6 10.8c.5.4.8.9.9 1.5l.2 1.2h5l.2-1.2c.1-.6.4-1.1.9-1.5A6 6 0 0 0 12 3Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.5 20.5h5M10 18h4" />
          </svg>
          Helpful tips
        </h4>
        <ul className="space-y-1.5">
          {data.tips.map((t, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-600 leading-relaxed">
              <span className="text-amber-500 mt-0.5 shrink-0">•</span>
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </div>

      <GovernmentTipBox>{data.government}</GovernmentTipBox>
    </SectionAccordion>
  );
}
