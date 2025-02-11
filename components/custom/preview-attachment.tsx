import { Attachment } from 'ai';
import { XIcon } from 'lucide-react';
import { Button } from '../ui/button';

import { LoaderIcon } from './icons';

interface PreviewAttachmentProps {
  attachment: Attachment;
  isUploading?: boolean;
  onRemove?: () => void;
}

export function PreviewAttachment({
  attachment,
  isUploading,
  onRemove,
}: PreviewAttachmentProps) {
  const { name, url, contentType } = attachment;

  return (
    <div className="flex items-center gap-2 p-2 text-sm text-muted-foreground bg-muted rounded-md">
      <span>{isUploading ? `Subiendo ${name}...` : name}</span>
      {!isUploading && onRemove && (
        <Button
          variant="ghost"
          size="icon"
          className="h-4 w-4 p-0"
          onClick={onRemove}
        >
          <XIcon className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}
