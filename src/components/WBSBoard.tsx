
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface WBSNode {
  id: string;
  name: string;
  children?: WBSNode[];
}

interface WBSBoardProps {
  className?: string;
  initialData?: WBSNode;
}

const WBSBoard = ({ className, initialData }: WBSBoardProps) => {
  const [data, setData] = useState<WBSNode>(initialData || {
    id: 'root',
    name: 'Projet',
    children: []
  });

  const renderNode = (node: WBSNode, level: number = 0) => {
    return (
      <div key={node.id} className="flex flex-col items-center">
        <div 
          className={cn(
            "relative p-3 m-2 rounded-lg border shadow-sm text-center min-w-40 card-hover",
            level === 0 ? "bg-blue-50 border-blue-200" : 
            level === 1 ? "bg-green-50 border-green-200" : 
            "bg-yellow-50 border-yellow-200"
          )}
        >
          {node.name}
        </div>
        
        {node.children && node.children.length > 0 && (
          <>
            <div className="w-px h-4 bg-gray-300"></div>
            <div className="flex flex-wrap justify-center">
              {node.children.map((child) => renderNode(child, level + 1))}
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className={cn("w-full overflow-auto p-4 rounded-lg border bg-white", className)}>
      <h3 className="text-xl font-medium mb-4">Structure de Découpage du Projet (WBS)</h3>
      <div className="flex justify-center min-w-full">
        {renderNode(data)}
      </div>
    </div>
  );
};

export default WBSBoard;
