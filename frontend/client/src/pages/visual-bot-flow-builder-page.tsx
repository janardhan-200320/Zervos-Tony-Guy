import { EnhancedBotFlowBuilder } from '@/components/botflow';
import { useParams } from 'wouter';

export default function VisualBotFlowBuilderPage() {
  const params = useParams<{ id?: string }>();
  
  return (
    <div className="w-full h-screen">
      <EnhancedBotFlowBuilder flowId={params.id} />
    </div>
  );
}
