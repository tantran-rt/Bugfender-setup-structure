import { ScrollArea } from "radix-ui";
import "./scrollview.css";

interface ScrollViewProps {
  children: React.ReactNode;
}

export const ScrollView = ({ children }: ScrollViewProps) => (
  <ScrollArea.Root className="ScrollAreaRoot" type="always">
    <ScrollArea.Viewport className="ScrollAreaViewport">
      {children}
    </ScrollArea.Viewport>
    <ScrollArea.Scrollbar
      className="ScrollAreaScrollbar"
      orientation="vertical"
    >
      <ScrollArea.Thumb className="ScrollAreaThumb" />
    </ScrollArea.Scrollbar>
  </ScrollArea.Root>
);
