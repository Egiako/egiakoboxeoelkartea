import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { SignatureCanvasComponent } from '@/components/SignatureCanvas';
import { CheckCircle, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ConsentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccept: (signature: string, method: 'canvas' | 'typed') => void;
}

export const ConsentModal = ({ open, onOpenChange, onAccept }: ConsentModalProps) => {
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [signatureMethod, setSignatureMethod] = useState<'canvas' | 'typed'>('canvas');
  const [consentAccepted, setConsentAccepted] = useState(false);
  const { toast } = useToast();

  const handleSignatureChange = (signature: string | null, method: 'canvas' | 'typed') => {
    setSignatureData(signature);
    setSignatureMethod(method);
  };

  const handleConfirm = () => {
    if (!signatureData) {
      toast({
        title: "Firma requerida",
        description: "Por favor, firma antes de continuar.",
        variant: "destructive"
      });
      return;
    }

    if (!consentAccepted) {
      toast({
        title: "Acepta el consentimiento",
        description: "Debes marcar la casilla de aceptación.",
        variant: "destructive"
      });
      return;
    }

    onAccept(signatureData, signatureMethod);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-oswald flex items-center gap-2">
            <FileText className="h-5 w-5 text-boxing-red" />
            Consentimiento Informado - EgiaK.O. Boxeo Elkartea
          </DialogTitle>
          <DialogDescription className="font-inter">
            Lee atentamente el consentimiento y firma para aceptar los términos
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 overflow-y-auto flex-1 pr-2">
          {/* Consent Text */}
          <div className="bg-muted/30 rounded-lg p-6 space-y-4 font-inter text-sm leading-relaxed">
            <p className="font-semibold text-base">
              Al participar en actividades de boxeo en EgiaK.O. Boxeo Elkartea, declaro que:
            </p>
            
            <ol className="space-y-3 list-decimal list-inside">
              <li>
                <strong>Conozco los riesgos:</strong> Entiendo que el boxeo es un deporte de contacto que conlleva riesgos inherentes de lesión, incluyendo pero no limitado a contusiones, esguinces, fracturas y otras lesiones físicas.
              </li>
              <li>
                <strong>Estado de salud:</strong> Confirmo que gozo de buena salud y no tengo ninguna condición médica que me impida practicar boxeo de manera segura. En caso de tener alguna condición médica, me comprometo a informar al instructor antes de comenzar.
              </li>
              <li>
                <strong>Seguro médico:</strong> Cuento con cobertura médica adecuada y asumo la responsabilidad de cualquier gasto médico derivado de mi participación en las actividades del club.
              </li>
              <li>
                <strong>Compromiso con las normas:</strong> Me comprometo a seguir todas las normas de seguridad establecidas por el club, usar el equipo de protección requerido, y seguir las instrucciones de los entrenadores en todo momento.
              </li>
              <li>
                <strong>Exención de responsabilidad:</strong> Acepto participar bajo mi propio riesgo y libero a EgiaK.O. Boxeo Elkartea, sus instructores, empleados y voluntarios de cualquier responsabilidad por lesiones o daños que pudiera sufrir durante mi participación.
              </li>
              <li>
                <strong>Uso de imagen:</strong> Autorizo al club a utilizar fotografías o videos en los que aparezca para fines promocionales y de difusión de las actividades del club, salvo que exprese lo contrario por escrito.
              </li>
            </ol>

            <p className="text-xs text-muted-foreground pt-2">
              <strong>Nota:</strong> Este consentimiento tiene validez indefinida mientras mantenga mi membresía activa en el club. Puedo revocar mi consentimiento en cualquier momento mediante comunicación escrita.
            </p>
          </div>

          {/* Signature Section */}
          <div className="border border-border rounded-lg p-4 bg-background space-y-3">
            <h4 className="font-semibold font-oswald text-sm">Firma Digital *</h4>
            <p className="text-xs text-muted-foreground">
              Firma para confirmar que has leído y aceptas el consentimiento informado
            </p>
            <SignatureCanvasComponent onSignatureChange={handleSignatureChange} />
            
            {signatureData && (
              <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 p-2 rounded">
                <CheckCircle className="h-4 w-4" />
                <span>Firma capturada correctamente</span>
              </div>
            )}
          </div>

          {/* Consent Checkbox */}
          <div className="flex items-start space-x-2 p-4 bg-muted/30 rounded-lg">
            <Checkbox 
              id="consent-checkbox" 
              checked={consentAccepted}
              onCheckedChange={(checked) => setConsentAccepted(checked as boolean)}
              required 
            />
            <Label htmlFor="consent-checkbox" className="text-xs font-inter leading-relaxed cursor-pointer">
              He leído, comprendido y acepto el consentimiento informado completo. Confirmo que la firma proporcionada es auténtica y que toda la información proporcionada es verídica. *
            </Label>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={!signatureData || !consentAccepted}
            variant="hero"
          >
            Firmar y aceptar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
