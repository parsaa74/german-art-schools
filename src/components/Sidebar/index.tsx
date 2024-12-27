import React from 'react';
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { SchoolBadge } from "@/components/ui/school-badge";
import { schools } from '@/types/school';
import { useSchoolStore } from '@/stores/schoolStore';

const Sidebar = () => {
  const { selectedSchool, setSelectedSchool } = useSchoolStore();

  return (
    <Card className="w-80 h-screen overflow-hidden flex flex-col">
      <CardHeader>
        <CardTitle>German Art Schools</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto">
        <Command>
          <CommandInput placeholder="Search schools..." />
          <CommandEmpty>No schools found.</CommandEmpty>
          <CommandGroup>
            {schools.map((school) => (
              <CommandItem
                key={school.id}
                onSelect={() => setSelectedSchool(school)}
                className={`flex items-center gap-2 p-2 cursor-pointer ${
                  selectedSchool?.id === school.id ? 'bg-accent' : ''
                }`}
              >
                <SchoolBadge type={school.type} />
                <span>{school.name}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </CardContent>
    </Card>
  );
};

export default Sidebar; 