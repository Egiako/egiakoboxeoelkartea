import { useRef, useEffect, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trash2, PenTool, Type } from 'lucide-react';

interface SignatureCanvasComponentProps {
  onSignatureChange: (signature: string | null, method: 'canvas' | 'typed') => void;
}

export const SignatureCanvasComponent = ({ onSignatureChange }: SignatureCanvasComponentProps) => {
  const sigCanvas = useRef<SignatureCanvas>(null);
  const [typedName, setTypedName] = useState('');
  const [signatureMethod, setSignatureMethod] = useState<'canvas' | 'typed'>('canvas');

  const clearSignature = () => {
    if (sigCanvas.current) {
      sigCanvas.current.clear();
      onSignatureChange(null, 'canvas');
    }
  };

  const handleCanvasEnd = () => {
    if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
      const dataUrl = sigCanvas.current.toDataURL('image/png');
      onSignatureChange(dataUrl, 'canvas');
    }
  };

  const handleTypedNameChange = (value: string) => {
    setTypedName(value);
    if (value.trim()) {
      // Generate a simple text signature
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 150;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.font = '40px Brush Script MT, cursive';
        ctx.fillStyle = 'black';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(value, canvas.width / 2, canvas.height / 2);
        onSignatureChange(canvas.toDataURL('image/png'), 'typed');
      }
    } else {
      onSignatureChange(null, 'typed');
    }
  };

  return (
    <div className="space-y-4">
      <Tabs value={signatureMethod} onValueChange={(v) => setSignatureMethod(v as 'canvas' | 'typed')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="canvas" className="text-xs">
            <PenTool className="h-3 w-3 mr-1" />
            Dibujar firma
          </TabsTrigger>
          <TabsTrigger value="typed" className="text-xs">
            <Type className="h-3 w-3 mr-1" />
            Escribir nombre
          </TabsTrigger>
        </TabsList>

        <TabsContent value="canvas" className="space-y-2">
          <Label className="text-xs font-inter">Dibuja tu firma aquí *</Label>
          <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg overflow-hidden bg-white">
            <SignatureCanvas
              ref={sigCanvas}
              canvasProps={{
                className: 'w-full h-32 cursor-crosshair',
              }}
              onEnd={handleCanvasEnd}
              backgroundColor="rgb(255, 255, 255)"
              penColor="rgb(0, 0, 0)"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={clearSignature}
            className="w-full text-xs"
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Borrar firma
          </Button>
        </TabsContent>

        <TabsContent value="typed" className="space-y-2">
          <Label htmlFor="typed-name" className="text-xs font-inter">
            Escribe tu nombre completo *
          </Label>
          <Input
            id="typed-name"
            value={typedName}
            onChange={(e) => handleTypedNameChange(e.target.value)}
            placeholder="Nombre completo"
            className="text-sm"
          />
          {typedName && (
            <div className="border-2 border-muted-foreground/30 rounded-lg p-4 bg-white h-32 flex items-center justify-center">
              <span style={{ fontFamily: 'Brush Script MT, cursive', fontSize: '32px' }}>
                {typedName}
              </span>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
