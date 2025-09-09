import { Injectable, Logger } from '@nestjs/common';
import { readFile } from 'fs/promises';
import * as mammoth from 'mammoth';
import * as MarkdownIt from 'markdown-it';
import { FileBlock } from '../entities/file.entity';

export interface ParseResult {
  canonicalText: string;
  blocks: FileBlock[];
  metadata?: Record<string, any>;
}

@Injectable()
export class FileParserService {
  private readonly logger = new Logger(FileParserService.name);
  private readonly markdownParser = new MarkdownIt();

  async parseFile(filePath: string, mimeType: string): Promise<ParseResult> {
    try {
      this.logger.log(`开始解析文件: ${filePath}, 类型: ${mimeType}`);

      // 根据文件扩展名判断类型（作为MIME类型的补充）
      const fileExtension = filePath.toLowerCase().substring(filePath.lastIndexOf('.'));

      if (this.isWordDocument(mimeType, fileExtension)) {
        return await this.parseWordDocument(filePath);
      } else if (this.isMarkdown(mimeType, fileExtension)) {
        return await this.parseMarkdown(filePath);
      } else if (this.isTextFile(mimeType, fileExtension)) {
        return await this.parseTextFile(filePath);
      } else {
        throw new Error(`不支持的文件类型: ${mimeType} (${fileExtension})`);
      }
    } catch (error) {
      this.logger.error(`文件解析失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async parseWordDocument(filePath: string): Promise<ParseResult> {
    const buffer = await readFile(filePath);
    const result = await mammoth.extractRawText({ buffer });
    
    const canonicalText = result.value;
    const blocks = this.createBlocksFromText(canonicalText);
    
    return {
      canonicalText,
      blocks,
      metadata: {
        messages: result.messages,
        wordCount: canonicalText.split(/\s+/).length,
      },
    };
  }

  private async parseMarkdown(filePath: string): Promise<ParseResult> {
    const content = await readFile(filePath, 'utf-8');
    
    // 解析Markdown为HTML，然后提取纯文本
    const html = this.markdownParser.render(content);
    const canonicalText = this.htmlToText(html);
    const blocks = this.createBlocksFromMarkdown(content);
    
    return {
      canonicalText,
      blocks,
      metadata: {
        originalMarkdown: content,
        wordCount: canonicalText.split(/\s+/).length,
      },
    };
  }

  private async parseTextFile(filePath: string): Promise<ParseResult> {
    const canonicalText = await readFile(filePath, 'utf-8');
    const blocks = this.createBlocksFromText(canonicalText);
    
    return {
      canonicalText,
      blocks,
      metadata: {
        wordCount: canonicalText.split(/\s+/).length,
      },
    };
  }

  private createBlocksFromText(text: string): FileBlock[] {
    const blocks: FileBlock[] = [];
    const paragraphs = text.split(/\n\s*\n/);
    let currentOffset = 0;

    paragraphs.forEach((paragraph, index) => {
      const trimmed = paragraph.trim();
      if (trimmed) {
        const startOffset = text.indexOf(trimmed, currentOffset);
        const endOffset = startOffset + trimmed.length;
        
        blocks.push({
          blockId: `p-${index}`,
          type: 'paragraph',
          text: trimmed,
          startOffset,
          endOffset,
          meta: {},
        });
        
        currentOffset = endOffset;
      }
    });

    return blocks;
  }

  private createBlocksFromMarkdown(markdown: string): FileBlock[] {
    const blocks: FileBlock[] = [];
    const lines = markdown.split('\n');
    let currentOffset = 0;
    let blockIndex = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      
      if (trimmed) {
        let type: 'paragraph' | 'heading' | 'list' = 'paragraph';
        
        if (trimmed.startsWith('#')) {
          type = 'heading';
        } else if (trimmed.startsWith('-') || trimmed.startsWith('*') || /^\d+\./.test(trimmed)) {
          type = 'list';
        }
        
        const startOffset = currentOffset;
        const endOffset = startOffset + line.length;
        
        blocks.push({
          blockId: `${type}-${blockIndex++}`,
          type,
          text: trimmed,
          startOffset,
          endOffset,
          meta: {
            lineNumber: i + 1,
          },
        });
      }
      
      currentOffset += line.length + 1; // +1 for newline
    }

    return blocks;
  }

  private htmlToText(html: string): string {
    // 简单的HTML到文本转换
    return html
      .replace(/<[^>]*>/g, '') // 移除HTML标签
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }

  private isWordDocument(mimeType: string, fileExtension?: string): boolean {
    return mimeType.includes('wordprocessingml') ||
           mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
           fileExtension === '.docx';
  }

  private isMarkdown(mimeType: string, fileExtension?: string): boolean {
    return mimeType === 'text/markdown' ||
           mimeType === 'text/x-markdown' ||
           fileExtension === '.md';
  }

  private isTextFile(mimeType: string, fileExtension?: string): boolean {
    return mimeType === 'text/plain' ||
           fileExtension === '.txt';
  }
}
