import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Search } from 'lucide-react';

export function SearchDialog() {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [debouncedValue, setDebouncedValue] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(searchValue);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchValue]);

  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['search', debouncedValue],
    queryFn: async () => {
      if (!debouncedValue.trim()) return [];
      const { data, error } = await supabase.rpc('search_products', {
        search_term: debouncedValue.trim()
      });
      if (error) {
        console.error("RPC Search Error:", error);
        throw error;
      }
      return data;
    },
    enabled: !!debouncedValue.trim(),
  });

  const handleSelect = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  return (
    <>
      <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setOpen(true)}>
        <Search className="h-4 w-4 text-gray-600" />
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="พิมพ์ชื่อสินค้าที่ต้องการค้นหา..."
          value={searchValue}
          onValueChange={setSearchValue}
        />
        <CommandList>
          <CommandEmpty>{isLoading ? 'กำลังค้นหา...' : 'ไม่พบผลลัพธ์'}</CommandEmpty>
          
          {searchResults && searchResults.length > 0 && (
            <CommandGroup heading="สินค้า">
              {searchResults.map((product) => (
                // ✅ **แก้ไขส่วนนี้ให้แสดงรูปภาพ**
                <CommandItem
                  key={product.id}
                  value={product.name}
                  onSelect={() => handleSelect(`/products/${product.id}`)}
                  className="flex items-center gap-4" // เพิ่ม class เพื่อจัดเรียง
                >
                  <img 
                    src={product.image_url || '/placeholder.svg'} 
                    alt={product.name}
                    className="w-10 h-10 object-cover rounded-md border" 
                  />
                  <span className="flex-1">{product.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}