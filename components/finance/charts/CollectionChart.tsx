
import React from 'react';

const CollectionChart: React.FC = () => {
    // Mock data. In a real app, this would come from props/API.
    const data = {
        collections: 78000,
        dues: 22000
    };
    const total = data.collections + data.dues;
    const collectionPercentage = total > 0 ? (data.collections / total) * 100 : 0;

    return (
        <div className="h-full w-full flex flex-col justify-center">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-sm mb-4 gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-sm bg-primary shadow-sm"></div>
                    <div>
                        <span className="font-bold text-foreground">Collected</span>
                        <span className="text-muted-foreground ml-2 font-mono">${data.collections.toLocaleString()}</span>
                    </div>
                </div>
                 <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-sm bg-muted shadow-inner"></div>
                     <div>
                        <span className="font-bold text-foreground">Pending Dues</span>
                        <span className="text-muted-foreground ml-2 font-mono">${data.dues.toLocaleString()}</span>
                    </div>
                </div>
                <div className="font-bold text-lg text-foreground">
                    Total: <span className="font-mono">${total.toLocaleString()}</span>
                </div>
            </div>
            <div className="w-full h-8 bg-muted rounded-full flex overflow-hidden shadow-inner border border-border/50">
                <div 
                    className="h-full bg-primary transition-all duration-1000 ease-out flex items-center justify-center text-xs font-bold text-primary-foreground"
                    style={{ width: `${collectionPercentage}%` }}
                >
                   {collectionPercentage > 10 && `${Math.round(collectionPercentage)}%`}
                </div>
            </div>
        </div>
    );
};

export default CollectionChart;
