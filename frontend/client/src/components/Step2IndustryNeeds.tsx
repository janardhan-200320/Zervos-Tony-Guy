import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useOnboarding } from '@/contexts/OnboardingContext';
import ChipSelector from './ChipSelector';

// Industry options and their specific needs mapping
const INDUSTRY_OPTIONS = [
  'HR / People & Org',
  'Sales',
  'Marketing',
  'Customer Support',
  'Information Technology (IT) Services',
  'Healthcare',
  'Education / Training',
  'Finance / Accounting',
  'Real Estate',
  'Travel / Hospitality',
  'Consulting Firms / Professional Services',
  'Salons & Spa / Personal Care',
  'Fitness / Wellness',
  'Others',
] as const;

const NEEDS_BY_INDUSTRY: Record<(typeof INDUSTRY_OPTIONS)[number], string[]> = {
  'HR / People & Org': [
    'Recruitment Strategy Meeting',
    'Onboarding',
    'Performance Management',
    'Employee Engagement',
    'Compliance Review',
  ],
  Sales: [
    'Lead Qualification Call',
    'Product Demo',
    'Sales Presentation',
    'Contract Negotiation',
    'Customer Feedback Session',
  ],
  Marketing: [
    'Campaign Strategy',
    'Content Planning',
    'Brand Audit',
    'Social Media Workshop',
    'Influencer Collaboration',
  ],
  'Customer Support': [
    'Support Ticket Review',
    'Customer Satisfaction Survey',
    'On-site Service Call',
    'Warranty Check',
    'Product Training',
  ],
  'Information Technology (IT) Services': [
    'System Audit',
    'Network Setup',
    'Software Implementation',
    'Data Migration',
    'Managed Services Review',
  ],
  Healthcare: [
    'Patient Consultation',
    'Follow-up Check-up',
    'Wellness Screening',
    'Telemedicine Session',
    'Specialty Referral',
  ],
  'Education / Training': [
    'Course Enrollment Consultation',
    'Demo Class',
    'Student Counselling',
    'Teacher Onboarding',
    'Curriculum Planning',
  ],
  'Finance / Accounting': [
    'Financial Review',
    'Tax Planning Session',
    'Audit Meeting',
    'Investment Consultation',
    'Compliance Advisory',
  ],
  'Real Estate': [
    'Property Viewing Appointment',
    'Rental Consultation',
    'Home Valuation Meeting',
    'Broker Onboarding',
    'Maintenance Inspection',
  ],
  'Travel / Hospitality': [
    'Trip Planning Discussion',
    'Hotel Reservation Assistance',
    'Corporate Travel Review',
    'Tour Package Presentation',
    'Guest Feedback Session',
  ],
  'Consulting Firms / Professional Services': [
    'Strategy Workshop',
    'Business Diagnosis',
    'Advisory Session',
    'Change Management Review',
    'Implementation Kick-off',
  ],
  'Salons & Spa / Personal Care': [
    'Haircut Appointment',
    'Skin Treatment Consultation',
    'Massage Booking',
    'Wellness Plan Review',
    'Bridal Session',
  ],
  'Fitness / Wellness': [
    'Personal Training Session',
    'Group Class Booking',
    'Fitness Assessment',
    'Nutrition Consultation',
    'Wellness Workshop',
  ],
  Others: [],
};

export default function Step2IndustryNeeds() {
  const { data, updateData, nextStep, prevStep } = useOnboarding();

  // Enforce single selection for industry by storing at most one value
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>(
    data.industries?.length ? [data.industries[0]] : []
  );
  // We allow selecting one need, or typing a custom one if Others is chosen
  const [selectedNeeds, setSelectedNeeds] = useState<string[]>(
    data.businessNeeds?.length ? [data.businessNeeds[0]] : []
  );
  const [customNeed, setCustomNeed] = useState<string>(
    data.businessNeeds?.length && !Object.values(NEEDS_BY_INDUSTRY).flat().includes(data.businessNeeds[0])
      ? data.businessNeeds[0]
      : ''
  );

  const selectedIndustry = selectedIndustries[0];
  const needsOptions = useMemo(() => {
    if (!selectedIndustry) return [] as string[];
    return NEEDS_BY_INDUSTRY[selectedIndustry as (typeof INDUSTRY_OPTIONS)[number]] ?? [];
  }, [selectedIndustry]);

  const isFormValid = selectedIndustries.length > 0;

  const effectiveNeeds = () => {
    if (selectedIndustry === 'Others') {
      return customNeed ? [customNeed] : [];
    }
    return selectedNeeds;
  };

  const handleNext = () => {
    updateData({ industries: selectedIndustries, businessNeeds: effectiveNeeds() });
    nextStep();
  };

  const handleBack = () => {
    updateData({ industries: selectedIndustries, businessNeeds: effectiveNeeds() });
    prevStep();
  };

  return (
    <div className="space-y-8">
      <div className="space-y-8">
        <ChipSelector
          options={INDUSTRY_OPTIONS as unknown as string[]}
          selected={selectedIndustries}
          onChange={(sel) => setSelectedIndustries(sel.slice(0, 1))}
          label="Which industry best describes your business?"
          selectionMode="single"
        />

        {selectedIndustry && selectedIndustry !== 'Others' && (
          <ChipSelector
            options={needsOptions}
            selected={selectedNeeds}
            onChange={(sel) => setSelectedNeeds(sel.slice(0, 1))}
            label="...and what specific need are you trying to address?"
            selectionMode="single"
          />
        )}

        {selectedIndustry === 'Others' && (
          <div className="space-y-2">
            <h3 className="text-base font-medium text-foreground">
              Specify your business need
            </h3>
            <Input
              value={customNeed}
              onChange={(e) => setCustomNeed(e.target.value)}
              placeholder="Describe your specific need..."
            />
          </div>
        )}
      </div>

      <div className="flex justify-between pt-4">
        <Button
          variant="outline"
          onClick={handleBack}
          data-testid="button-back"
          className="min-w-32"
        >
          Back
        </Button>
        <Button
          onClick={handleNext}
          disabled={!isFormValid}
          data-testid="button-next"
          className="min-w-32"
        >
          Next
        </Button>
      </div>
    </div>
  );
}
