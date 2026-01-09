import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';

type Signal = {
  pair: string;
  type: 'BUY' | 'SELL';
  probability: number;
  volatility: number;
  trend: 'up' | 'down' | 'sideways';
};

type Trade = {
  id: string;
  pair: string;
  type: 'BUY' | 'SELL';
  amount: number;
  status: 'active' | 'win' | 'loss';
  profit: number;
  timestamp: Date;
};

const generateMockSignals = (): Signal[] => {
  const pairs = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'USD/CHF', 'EUR/GBP'];
  const trends: Array<'up' | 'down' | 'sideways'> = ['up', 'down', 'sideways'];
  
  return pairs.map(pair => ({
    pair,
    type: Math.random() > 0.5 ? 'BUY' : 'SELL',
    probability: Math.floor(Math.random() * 30) + 65,
    volatility: Math.floor(Math.random() * 40) + 20,
    trend: trends[Math.floor(Math.random() * trends.length)]
  })).sort((a, b) => b.probability - a.probability);
};

const generateMockCandles = () => {
  const candles = [];
  let basePrice = 1.0850;
  
  for (let i = 0; i < 30; i++) {
    const change = (Math.random() - 0.5) * 0.0020;
    const open = basePrice;
    const close = basePrice + change;
    const high = Math.max(open, close) + Math.random() * 0.0010;
    const low = Math.min(open, close) - Math.random() * 0.0010;
    
    candles.push({ open, high, low, close });
    basePrice = close;
  }
  
  return candles;
};

export default function Index() {
  const [signals, setSignals] = useState<Signal[]>(generateMockSignals());
  const [isAutoTrading, setIsAutoTrading] = useState(false);
  const [balance, setBalance] = useState(1000);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [minBet, setMinBet] = useState([0.5]);
  const [maxBet, setMaxBet] = useState([100]);
  const [candles] = useState(generateMockCandles());
  const [selectedPair, setSelectedPair] = useState('EUR/USD');

  useEffect(() => {
    const interval = setInterval(() => {
      setSignals(generateMockSignals());
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isAutoTrading) return;

    const tradeInterval = setInterval(() => {
      const topSignal = signals[0];
      if (topSignal.probability >= 75 && balance > minBet[0]) {
        const newTrade: Trade = {
          id: Date.now().toString(),
          pair: topSignal.pair,
          type: topSignal.type,
          amount: minBet[0],
          status: 'active',
          profit: 0,
          timestamp: new Date()
        };
        
        setTrades(prev => [newTrade, ...prev]);
        setBalance(prev => prev - minBet[0]);

        setTimeout(() => {
          const success = Math.random() < (topSignal.probability / 100);
          setTrades(prev => prev.map(t => 
            t.id === newTrade.id 
              ? { ...t, status: success ? 'win' : 'loss', profit: success ? minBet[0] * 0.85 : -minBet[0] }
              : t
          ));
          
          if (success) {
            setBalance(prev => prev + minBet[0] + (minBet[0] * 0.85));
          }
        }, 60000);
      }

      if (balance < (1000 - 5)) {
        setIsAutoTrading(false);
      }
    }, 60000);

    return () => clearInterval(tradeInterval);
  }, [isAutoTrading, signals, balance, minBet]);

  const totalProfit = trades.reduce((sum, t) => sum + t.profit, 0);
  const winRate = trades.length > 0 
    ? (trades.filter(t => t.status === 'win').length / trades.filter(t => t.status !== 'active').length * 100) || 0 
    : 0;

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Icon name="TrendingUp" size={24} className="text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Pocket Option Bot</h1>
              <p className="text-sm text-muted-foreground">Автоматическая торговля OTC</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Баланс</p>
              <p className="text-2xl font-mono font-bold">${balance.toFixed(2)}</p>
              <p className={`text-xs font-mono ${totalProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
                {totalProfit >= 0 ? '+' : ''}{totalProfit.toFixed(2)} ({winRate.toFixed(1)}%)
              </p>
            </div>
            
            <div className="flex items-center gap-2 px-4 py-2 bg-card rounded-lg border">
              <Label htmlFor="auto-trade" className="text-sm">Авто-трейдинг</Label>
              <Switch 
                id="auto-trade"
                checked={isAutoTrading} 
                onCheckedChange={setIsAutoTrading}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">График {selectedPair}</h2>
              <div className="flex gap-2">
                <Badge variant="outline" className="font-mono">1m</Badge>
                <Badge variant="outline" className="font-mono">OTC</Badge>
              </div>
            </div>

            <div className="h-80 relative">
              <svg className="w-full h-full">
                <line x1="0" y1="50%" x2="100%" y2="50%" stroke="hsl(var(--muted-foreground))" strokeOpacity="0.2" strokeDasharray="4" />
                
                {candles.map((candle, i) => {
                  const x = (i / candles.length) * 100;
                  const width = (1 / candles.length) * 100 * 0.6;
                  
                  const priceRange = Math.max(...candles.map(c => c.high)) - Math.min(...candles.map(c => c.low));
                  const minPrice = Math.min(...candles.map(c => c.low));
                  
                  const yOpen = ((candle.open - minPrice) / priceRange) * 80;
                  const yClose = ((candle.close - minPrice) / priceRange) * 80;
                  const yHigh = ((candle.high - minPrice) / priceRange) * 80;
                  const yLow = ((candle.low - minPrice) / priceRange) * 80;
                  
                  const isGreen = candle.close > candle.open;
                  const color = isGreen ? 'hsl(var(--success))' : 'hsl(var(--destructive))';
                  
                  return (
                    <g key={i}>
                      <line 
                        x1={`${x + width / 2}%`}
                        y1={`${90 - yHigh}%`}
                        x2={`${x + width / 2}%`}
                        y2={`${90 - yLow}%`}
                        stroke={color}
                        strokeWidth="1"
                      />
                      <rect
                        x={`${x}%`}
                        y={`${90 - Math.max(yOpen, yClose)}%`}
                        width={`${width}%`}
                        height={`${Math.abs(yClose - yOpen)}%`}
                        fill={color}
                      />
                    </g>
                  );
                })}
              </svg>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-4 border-t">
              <div>
                <p className="text-xs text-muted-foreground">Волатильность</p>
                <p className="text-lg font-mono font-semibold text-primary">
                  {signals.find(s => s.pair === selectedPair)?.volatility || 0}%
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Тренд</p>
                <Badge variant="outline" className="mt-1">
                  {signals.find(s => s.pair === selectedPair)?.trend || 'sideways'}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Вероятность</p>
                <p className="text-lg font-mono font-semibold text-success">
                  {signals.find(s => s.pair === selectedPair)?.probability || 0}%
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Сигналы</h2>
              <Icon name="Radio" size={16} className="text-success animate-pulse-glow" />
            </div>

            <div className="space-y-2">
              {signals.slice(0, 6).map((signal, idx) => (
                <button
                  key={signal.pair}
                  onClick={() => setSelectedPair(signal.pair)}
                  className={`w-full p-3 rounded-lg border transition-all hover:border-primary ${
                    selectedPair === signal.pair ? 'border-primary bg-primary/10' : 'border-border'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono font-semibold">{signal.pair}</span>
                    <Badge 
                      variant={signal.type === 'BUY' ? 'default' : 'destructive'}
                      className={signal.type === 'BUY' ? 'bg-success hover:bg-success' : ''}
                    >
                      {signal.type}
                    </Badge>
                  </div>
                  <Progress value={signal.probability} className="h-2 mb-1" />
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Шанс: {signal.probability}%</span>
                    <span className="text-muted-foreground">Vol: {signal.volatility}%</span>
                  </div>
                </button>
              ))}
            </div>
          </Card>
        </div>

        <Tabs defaultValue="history" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="history">История сделок</TabsTrigger>
            <TabsTrigger value="settings">Настройки</TabsTrigger>
          </TabsList>

          <TabsContent value="history" className="space-y-4">
            <Card className="p-6">
              <div className="space-y-3">
                {trades.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Icon name="History" size={48} className="mx-auto mb-2 opacity-50" />
                    <p>Нет активных сделок</p>
                  </div>
                ) : (
                  trades.slice(0, 10).map(trade => (
                    <div 
                      key={trade.id} 
                      className="flex items-center justify-between p-4 rounded-lg border"
                    >
                      <div className="flex items-center gap-4">
                        <Icon 
                          name={trade.type === 'BUY' ? 'TrendingUp' : 'TrendingDown'} 
                          className={trade.type === 'BUY' ? 'text-success' : 'text-destructive'}
                        />
                        <div>
                          <p className="font-mono font-semibold">{trade.pair}</p>
                          <p className="text-xs text-muted-foreground">
                            {trade.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="font-mono">${trade.amount.toFixed(2)}</p>
                        {trade.status !== 'active' && (
                          <p className={`text-sm font-mono ${
                            trade.profit >= 0 ? 'text-success' : 'text-destructive'
                          }`}>
                            {trade.profit >= 0 ? '+' : ''}{trade.profit.toFixed(2)}
                          </p>
                        )}
                      </div>

                      <Badge variant={
                        trade.status === 'active' ? 'outline' : 
                        trade.status === 'win' ? 'default' : 'destructive'
                      }>
                        {trade.status === 'active' ? 'Активна' : 
                         trade.status === 'win' ? 'Прибыль' : 'Убыток'}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card className="p-6 space-y-6">
              <div className="space-y-4">
                <div>
                  <Label>Минимальная ставка: ${minBet[0].toFixed(2)}</Label>
                  <Slider 
                    value={minBet} 
                    onValueChange={setMinBet}
                    min={0.5}
                    max={10}
                    step={0.5}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>Максимальная ставка: ${maxBet[0].toFixed(2)}</Label>
                  <Slider 
                    value={maxBet} 
                    onValueChange={setMaxBet}
                    min={10}
                    max={500}
                    step={10}
                    className="mt-2"
                  />
                </div>

                <div className="pt-4 border-t space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Стоп-лосс</Label>
                    <Badge variant="outline">$5.00</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Интервал сделки</Label>
                    <Badge variant="outline">1 минута</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Длительность сделки</Label>
                    <Badge variant="outline">До 2 минут</Badge>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Button className="w-full" disabled={isAutoTrading}>
                  <Icon name="Settings" size={16} className="mr-2" />
                  Подключить Pocket Option ID
                </Button>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Для автоматической торговли подключите ваш аккаунт
                </p>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
