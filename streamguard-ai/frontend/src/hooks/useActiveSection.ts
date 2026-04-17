import { useState, useEffect } from 'react';

export function useActiveSection(sectionIds: string[], offset = 100) {
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    const handleScroll = () => {
      let currentId = '';
      
      // Find the last section whose top is above the offset (or is currently in view)
      for (const id of sectionIds) {
        const element = document.getElementById(id);
        if (element) {
          const rect = element.getBoundingClientRect();
          // If the top of the section is at or above the viewport + offset
          if (rect.top <= offset) {
            currentId = id;
          }
        }
      }
      
      // If we scrolled past all sections or haven't reached the first, we might want to default to empty
      // but usually we keep currentId if it was found
      
      // For very bottom of page, might want to explicitly set to last item
      if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 50) {
        currentId = sectionIds[sectionIds.length - 1];
      }

      if (currentId && currentId !== activeId) {
        setActiveId(currentId);
      }
    };

    // Initial check
    handleScroll();

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [sectionIds, activeId, offset]);

  return activeId;
}
