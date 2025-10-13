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
              EGIAK.O. BOXEO ELKARTEA
            </p>
            
            <ol className="space-y-3 list-decimal list-inside">
              <li>
                <strong>ACEPTACIÓN DE RIESGOS:</strong> El/la abajo firmante declara que participa voluntariamente en las actividades, entrenamientos y competiciones organizadas por EgiaK.O. Boxeo Elkartea, siendo plenamente consciente de que el boxeo y la actividad física implican riesgos inherentes como lesiones musculares, contusiones, fracturas u otros daños físicos. El/la participante asume dichos riesgos bajo su propia responsabilidad, eximiendo expresamente a EgiaK.O. Boxeo Elkartea, a sus monitores, entrenadores, directivos y colaboradores de cualquier tipo de responsabilidad civil, penal o económica derivada de accidentes o lesiones que pudieran producirse durante la práctica o participación en las actividades de la asociación, salvo en casos de negligencia demostrable.
              </li>
              <li>
                <strong>ESTADO DE SALUD:</strong> El/la participante declara que se encuentra en buen estado de salud física y mental para la práctica del boxeo, y que no padece enfermedades o limitaciones que puedan poner en riesgo su integridad o la de otros participantes. Asimismo, se compromete a informar a la asociación de cualquier cambio relevante en su estado de salud.
              </li>
              <li>
                <strong>MENORES DE EDAD:</strong> En caso de que el/la participante sea menor de 18 años, el/la padre/madre/tutor/a legal deberá firmar este documento, manifestando su consentimiento expreso para la participación del menor en las actividades de la asociación y aceptando las condiciones aquí descritas.
              </li>
              <li>
                <strong>USO DE IMAGEN:</strong> Autorizo a EgiaK.O. Boxeo Elkartea a tomar y utilizar imágenes o vídeos en los que pueda aparecer durante entrenamientos, competiciones o eventos, con fines promocionales, informativos o de difusión en redes sociales, web o material divulgativo de la asociación, sin derecho a contraprestación económica alguna. El/la participante podrá revocar esta autorización por escrito en cualquier momento.
              </li>
              <li>
                <strong>PROTECCIÓN DE DATOS:</strong> Los datos personales recogidos serán tratados conforme a la legislación vigente en materia de protección de datos personales (Reglamento (UE) 2016/679 y LOPDGDD), siendo el responsable del tratamiento EgiaK.O. Boxeo Elkartea. Los datos se utilizarán únicamente para la gestión administrativa y deportiva de la asociación.
              </li>
              <li>
                <strong>COMPROMISO CON LAS NORMAS:</strong> Me comprometo a seguir todas las normas de seguridad establecidas por la asociación, usar el equipo de protección requerido, y seguir las instrucciones de los entrenadores en todo momento.
              </li>
              <li>
                <strong>DECLARACIÓN FINAL:</strong> He leído y comprendido todo lo anterior. Firmo este documento de manera libre y voluntaria, manifestando que acepto todas las condiciones descritas y libero de responsabilidad a EgiaK.O. Boxeo Elkartea en los términos expuestos.
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
