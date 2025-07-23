import { useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from '@/components/ui/button';
import { Download, FileText, Eye, Sun, Moon } from 'lucide-react';
import jsPDF from 'jspdf';
import MarkdownIt from 'markdown-it';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

const defaultMarkdown = `# Welcome to Markdown PDF Forge

Start typing your markdown content here! You can use all standard markdown features.

## Features

- **Bold text** and *italic text*
- Lists with items
- [Links](https://example.com)
- Code blocks and \`inline code\`

### Code Example

\`\`\`javascript
function hello() {
  console.log("Hello, World!");
}
\`\`\`

### Task List

- [x] Create markdown editor
- [x] Add live preview
- [ ] Export to PDF
- [ ] Share with others

> This is a blockquote. Great for highlighting important information!

---

Happy writing! 🚀
`;

export const MarkdownEditor = () => {
  const [markdown, setMarkdown] = useState(defaultMarkdown);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleMarkdownChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMarkdown(e.target.value);
  }, []);

  const generatePDF = async () => {
    setIsGeneratingPDF(true);
    
    try {
      // Initialize markdown-it parser
      const md = new MarkdownIt({
        html: true,
        breaks: true,
        linkify: true,
      });

      // Convert markdown to HTML
      const htmlContent = md.render(markdown);
      
      // Create PDF with proper text rendering
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Set up PDF styling
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      const maxWidth = pageWidth - (margin * 2);

      // Extract title from markdown (first heading)
      const titleMatch = markdown.match(/^#\s+(.+)$/m);
      const title = titleMatch ? titleMatch[1] : 'Markdown Document';

      // Add content to PDF
      let yPosition = margin;
      
      // Split content into lines and add to PDF
      const lines = markdown.split('\n');
      let currentFontSize = 12;
      
      pdf.setFont('helvetica', 'normal');
      
      for (const line of lines) {
        if (yPosition > pageHeight - margin) {
          pdf.addPage();
          yPosition = margin;
        }

        // Handle different markdown elements
        if (line.startsWith('# ')) {
          // H1
          pdf.setFontSize(20);
          pdf.setFont('helvetica', 'bold');
          const text = line.replace(/^#\s+/, '');
          pdf.text(text, margin, yPosition);
          yPosition += 15;
        } else if (line.startsWith('## ')) {
          // H2
          pdf.setFontSize(16);
          pdf.setFont('helvetica', 'bold');
          const text = line.replace(/^##\s+/, '');
          pdf.text(text, margin, yPosition);
          yPosition += 12;
        } else if (line.startsWith('### ')) {
          // H3
          pdf.setFontSize(14);
          pdf.setFont('helvetica', 'bold');
          const text = line.replace(/^###\s+/, '');
          pdf.text(text, margin, yPosition);
          yPosition += 10;
        } else if (line.startsWith('- ') || line.startsWith('* ')) {
          // List items
          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'normal');
          const text = '• ' + line.replace(/^[-*]\s+/, '');
          const wrappedText = pdf.splitTextToSize(text, maxWidth);
          pdf.text(wrappedText, margin + 5, yPosition);
          yPosition += wrappedText.length * 6;
        } else if (line.startsWith('> ')) {
          // Blockquotes
          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'italic');
          const text = line.replace(/^>\s+/, '');
          const wrappedText = pdf.splitTextToSize(text, maxWidth - 10);
          pdf.text(wrappedText, margin + 10, yPosition);
          yPosition += wrappedText.length * 6;
        } else if (line.trim() === '' || line.trim() === '---') {
          // Empty lines or horizontal rules
          yPosition += 6;
        } else if (line.trim()) {
          // Regular paragraphs
          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'normal');
          
          // Handle bold and italic text
          let processedText = line
            .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold markers (we'll handle styling separately)
            .replace(/\*([^*]+)\*/g, '$1')     // Remove italic markers
            .replace(/`(.*?)`/g, '$1');      // Remove code markers
          
          const wrappedText = pdf.splitTextToSize(processedText, maxWidth);
          pdf.text(wrappedText, margin, yPosition);
          yPosition += wrappedText.length * 6;
        }
        
        yPosition += 2; // Small spacing between elements
      }
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const filename = `${title.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${timestamp}.pdf`;
      
      pdf.save(filename);
      
      toast({
        title: "PDF Generated Successfully!",
        description: `Downloaded as ${filename}`,
      });
    } catch (error) {
      console.error('PDF generation failed:', error);
      toast({
        title: "PDF Generation Failed",
        description: "There was an error generating the PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-card">
        <div className="flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-semibold text-foreground">Markdown PDF Forge</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="h-9 w-9"
            disabled={!mounted}
          >
            {mounted && theme === 'dark' ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
            <span className="sr-only">Toggle theme</span>
          </Button>
          <Button
            onClick={generatePDF}
            disabled={isGeneratingPDF}
            className="gap-2"
          >
            {isGeneratingPDF ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Generating...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Download PDF
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor Panel */}
        <div className="w-1/2 flex flex-col border-r">
          <div className="flex items-center gap-2 p-3 bg-editor-gutter border-b text-sm text-muted-foreground">
            <FileText className="h-4 w-4" />
            <span>Editor</span>
          </div>
          <div className="flex-1 relative">
            <textarea
              value={markdown}
              onChange={handleMarkdownChange}
              className="w-full h-full p-4 bg-editor-bg text-foreground font-mono text-sm resize-none border-0 outline-none focus:outline-none focus:ring-0"
              placeholder="Start typing your markdown here..."
              spellCheck={false}
            />
          </div>
        </div>

        {/* Preview Panel */}
        <div className="w-1/2 flex flex-col">
          <div className="flex items-center gap-2 p-3 bg-editor-gutter border-b text-sm text-muted-foreground">
            <Eye className="h-4 w-4" />
            <span>Preview</span>
          </div>
          <div className="flex-1 overflow-auto bg-preview-bg">
            <div
              id="markdown-preview"
              className="p-6 max-w-none prose prose-slate dark:prose-invert prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-code:text-foreground prose-pre:bg-muted prose-blockquote:text-muted-foreground prose-blockquote:border-l-primary prose-a:text-primary prose-li:text-foreground"
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {markdown}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};