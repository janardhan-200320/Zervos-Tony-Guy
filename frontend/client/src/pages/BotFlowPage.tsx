import React from 'react';
import { EnhancedBotFlowBuilder } from '@/components/botflow';

const BotFlowPage: React.FC = () => {
  return (
    <div className="h-screen w-full">
      <EnhancedBotFlowBuilder />
    </div>
  );
};

export default BotFlowPage;
