import { useEffect } from 'react';
import Clarity from '@microsoft/clarity';

interface ClarityProps {
  projectId: string;
}

export const ClarityComponent: React.FC<ClarityProps> = ({ projectId }) => {
  useEffect(() => {
    if (projectId && projectId !== 'YOUR_PROJECT_ID') {
      Clarity.init(projectId);
      console.log('Microsoft Clarity initialized with project ID:', projectId);
    }
  }, [projectId]);

  return null; // This component doesn't render anything
};

export default ClarityComponent;