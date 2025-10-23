import { User, Mic } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface CharacterCardProps {
  id: string;
  name: string;
  description?: string;
  thumbnailUrl?: string;
  hasVoice?: boolean;
}

export function CharacterCard({ name, description, thumbnailUrl, hasVoice }: CharacterCardProps) {
  return (
    <Card className="overflow-hidden hover-elevate cursor-pointer" data-testid="card-character">
      <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-3">
        <Avatar className="h-12 w-12">
          <AvatarImage src={thumbnailUrl} alt={name} />
          <AvatarFallback>
            <User className="h-6 w-6" />
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold truncate" data-testid="text-character-name">{name}</h3>
          {hasVoice && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
              <Mic className="h-3 w-3" />
              <span>Voice assigned</span>
            </div>
          )}
        </div>
      </CardHeader>
      {description && (
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
        </CardContent>
      )}
    </Card>
  );
}
