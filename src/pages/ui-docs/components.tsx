import React, { useState } from 'react';
import { Trash2, Mail, Settings2, PencilLine, Users, ShieldHalf } from 'lucide-react';
import { DocPage, Preview } from './DocPage';
import { Button } from '../../components/ui/button';
import { Tag } from '../../components/ui/tag';
import { Input } from '../../components/ui/input';
import { Checkbox } from '../../components/ui/checkbox';
import NumberInput from '../../components/ui/NumberInput';
import { DatePicker } from '../../components/ui/date-picker';
import {
  Select,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from '../../components/ui/select';
import { Tooltip, TooltipProvider } from '../../components/ui/tooltip';
import { HoverCard, HoverCardTrigger, HoverCardContent } from '../../components/ui/hover-card';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '../../components/ui/dropdown-menu';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../components/ui/table';

const BUTTON_VARIANTS = ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'] as const;
const BUTTON_SIZES = ['xs', 'sm', 'default', 'lg'] as const;

export const ButtonDoc: React.FC = () => (
  <DocPage title="Button" description="src/components/ui/button.tsx — variant × size.">
    <Preview>
      {BUTTON_VARIANTS.map((variant) => (
        <Button key={variant} variant={variant}>
          {variant}
        </Button>
      ))}
    </Preview>
    <Preview>
      {BUTTON_SIZES.map((size) => (
        <Button key={size} size={size}>
          Size {size}
        </Button>
      ))}
      <Button size="icon">
        <Trash2 className="h-4 w-4" />
      </Button>
      <Button disabled>Disabled</Button>
    </Preview>
  </DocPage>
);

const TAG_COLORS = ['default', 'success', 'warning', 'error'] as const;
const TAG_SIZES = ['sm', 'default', 'lg'] as const;

export const TagDoc: React.FC = () => (
  <DocPage title="Tag" description="src/components/ui/tag.tsx — color × size.">
    <Preview>
      {TAG_COLORS.map((color) => (
        <Tag key={color} color={color}>
          {color}
        </Tag>
      ))}
    </Preview>
    <Preview>
      {TAG_SIZES.map((size) => (
        <Tag key={size} size={size}>
          Size {size}
        </Tag>
      ))}
      <Tag type="link">Link tag</Tag>
    </Preview>
  </DocPage>
);

export const InputDoc: React.FC = () => {
  const [value, setValue] = useState('');
  return (
    <DocPage title="Input" description="src/components/ui/input.tsx">
      <Preview>
        <Input
          placeholder="Type something…"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="max-w-xs"
        />
      </Preview>
    </DocPage>
  );
};

export const NumberInputDoc: React.FC = () => {
  const [value, setValue] = useState(10);
  return (
    <DocPage title="Number Input" description="src/components/ui/NumberInput.tsx">
      <Preview>
        <NumberInput value={value} min={1} max={20} onChange={setValue} />
      </Preview>
    </DocPage>
  );
};

export const CheckboxDoc: React.FC = () => {
  const [checked, setChecked] = useState(true);
  return (
    <DocPage title="Checkbox" description="src/components/ui/checkbox.tsx">
      <Preview>
        <label className="flex items-center gap-2 text-sm text-foreground">
          <Checkbox checked={checked} onCheckedChange={(v) => setChecked(v === true)} />
          Checkbox
        </label>
      </Preview>
    </DocPage>
  );
};

export const SelectDoc: React.FC = () => {
  const [value, setValue] = useState('spades');
  return (
    <DocPage title="Select" description="src/components/ui/select.tsx">
      <Preview>
        <Select value={value} onValueChange={setValue}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="spades">Spades</SelectItem>
            <SelectItem value="hearts">Hearts</SelectItem>
            <SelectItem value="clubs">Clubs</SelectItem>
            <SelectItem value="diamonds">Diamonds</SelectItem>
          </SelectContent>
        </Select>
      </Preview>
    </DocPage>
  );
};

export const DatePickerDoc: React.FC = () => {
  const [date, setDate] = useState('');
  return (
    <DocPage title="Date Picker" description="src/components/ui/date-picker.tsx">
      <Preview>
        <DatePicker value={date} onChange={setDate} className="w-44" />
      </Preview>
    </DocPage>
  );
};

export const TooltipDoc: React.FC = () => (
  <DocPage title="Tooltip" description="src/components/ui/tooltip.tsx">
    <TooltipProvider>
      <Preview>
        <Tooltip content="This is a tooltip">
          <Button variant="outline">Hover for tooltip</Button>
        </Tooltip>
      </Preview>
    </TooltipProvider>
  </DocPage>
);

export const HoverCardDoc: React.FC = () => (
  <DocPage title="Hover Card" description="src/components/ui/hover-card.tsx">
    <Preview>
      <HoverCard>
        <HoverCardTrigger asChild>
          <Button variant="outline">
            <Mail className="h-4 w-4 mr-2" /> Hover card
          </Button>
        </HoverCardTrigger>
        <HoverCardContent>
          <p className="text-sm text-foreground font-medium mb-1">Hover cards</p>
          <p className="text-xs text-muted-foreground">
            Used for lightweight previews — like a player's stats on hover.
          </p>
        </HoverCardContent>
      </HoverCard>
    </Preview>
  </DocPage>
);

export const DropdownMenuDoc: React.FC = () => (
  <DocPage
    title="Dropdown Menu"
    description="src/components/ui/dropdown-menu.tsx — wraps @radix-ui/react-dropdown-menu. Used for the score interface's 'Game options' menu."
  >
    <Preview>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="border border-input">
            <Settings2 className="h-4 w-4 mr-2" /> Game options
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem>
            <PencilLine className="h-4 w-4" /> Edit Game
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Users className="h-4 w-4" /> 4 Players
          </DropdownMenuItem>
          <DropdownMenuItem>
            <ShieldHalf className="h-4 w-4" /> League
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem destructive>
            <Trash2 className="h-4 w-4" /> Delete Game
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </Preview>
  </DocPage>
);

export const TableDoc: React.FC = () => (
  <DocPage title="Table" description="src/components/ui/table.tsx">
    <div className="rounded-xl border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Player</TableHead>
            <TableHead>Wins</TableHead>
            <TableHead>Score</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Ryan</TableCell>
            <TableCell>12</TableCell>
            <TableCell>184</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Jordan</TableCell>
            <TableCell>9</TableCell>
            <TableCell>163</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  </DocPage>
);
