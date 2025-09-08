import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Users, Wifi, WifiOff } from 'lucide-react';

interface RealTimeBookingStatusProps {
  currentCount: number;
  maxCapacity: number;
  className?: string;
}

const RealTimeBookingStatus = ({ currentCount, maxCapacity, className = "" }: RealTimeBookingStatusProps) => {
  const [isConnected, setIsConnected] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    setLastUpdate(new Date());
  }, [currentCount]);

  const isFull = currentCount >= maxCapacity;
  const percentage = Math.round((currentCount / maxCapacity) * 100);

  const getStatusColor = () => {
    if (isFull) return 'destructive';
    if (percentage >= 80) return 'outline';
    return 'secondary';
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-primary" />
        <span className="font-medium">
          {currentCount}/{maxCapacity} personas
        </span>
        <Badge variant={getStatusColor()}>
          {isFull ? 'Completa' : `${percentage}% ocupada`}
        </Badge>
      </div>
      
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        {isConnected ? (
          <Wifi className="h-3 w-3 text-green-500" />
        ) : (
          <WifiOff className="h-3 w-3 text-red-500" />
        )}
        <span>En tiempo real</span>
      </div>
    </div>
  );
};

export default RealTimeBookingStatus;