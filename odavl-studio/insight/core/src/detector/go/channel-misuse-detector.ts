/**
 * @fileoverview Detects common channel misuse patterns in Go
 * Channels are powerful but easy to misuse, causing deadlocks
 */

import { GoBaseDetector, type GoDetectorOptions, type GoIssue } from './go-base-detector';
import type { DetectorResult } from '../../types';

export class ChannelMisuseDetector extends GoBaseDetector {
  constructor(options: GoDetectorOptions = {}) {
    super(options);
  }

  async detect(filePath: string, content: string): Promise<DetectorResult> {
    if (!this.isGoFile(filePath) && !this.isGoTestFile(filePath)) {
      return { issues: [], duration: 0, detectorName: 'channel-misuse' };
    }

    const issues: GoIssue[] = [];
    const lines = content.split('\n');

    // Check for unbuffered channel with immediate send/receive
    this.detectUnbufferedChannelDeadlock(lines, filePath, issues);

    // Check for sending to closed channels
    this.detectSendToClosedChannel(lines, filePath, issues);

    // Check for closing already closed channels
    this.detectDoubleClose(lines, filePath, issues);

    // Check for nil channel operations
    this.detectNilChannelOperations(lines, filePath, issues);

    // Check for range over channel without close
    this.detectRangeWithoutClose(content, lines, filePath, issues);

    return {
      issues,
      duration: 0,
      detectorName: 'channel-misuse',
    };
  }

  /**
   * Detect unbuffered channels that may cause immediate deadlock
   */
  private detectUnbufferedChannelDeadlock(
    lines: string[],
    filePath: string,
    issues: GoIssue[]
  ): void {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Pattern: ch := make(chan Type) followed by ch <- value in same function
      if (/make\s*\(\s*chan\s+\w+\s*\)/.test(line) && !/<-/.test(line)) {
        // Check next few lines for immediate send without goroutine
        for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
          const nextLine = lines[j];
          if (/\w+\s*<-/.test(nextLine) && !/go\s+/.test(nextLine) && !/select/.test(nextLine)) {
            issues.push(
              this.createIssue(
                'channel',
                'Potential deadlock: unbuffered channel send without goroutine or select',
                filePath,
                j + 1,
                0,
                'critical',
                'channel-misuse-detector'
              )
            );
            break;
          }
        }
      }
    }
  }

  /**
   * Detect sends to potentially closed channels
   */
  private detectSendToClosedChannel(
    lines: string[],
    filePath: string,
    issues: GoIssue[]
  ): void {
    const closedChannels = new Set<string>();

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Track closed channels
      const closeMatch = line.match(/close\s*\(\s*(\w+)\s*\)/);
      if (closeMatch) {
        closedChannels.add(closeMatch[1]);
      }

      // Check for sends to closed channels
      const sendMatch = line.match(/(\w+)\s*<-/);
      if (sendMatch && closedChannels.has(sendMatch[1])) {
        issues.push(
          this.createIssue(
            'channel',
            `Sending to closed channel '${sendMatch[1]}' causes panic`,
            filePath,
            i + 1,
            0,
            'critical',
            'channel-misuse-detector'
          )
        );
      }
    }
  }

  /**
   * Detect double close on channels
   */
  private detectDoubleClose(
    lines: string[],
    filePath: string,
    issues: GoIssue[]
  ): void {
    const closedChannels = new Map<string, number>();

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const closeMatch = line.match(/close\s*\(\s*(\w+)\s*\)/);
      
      if (closeMatch) {
        const channelName = closeMatch[1];
        if (closedChannels.has(channelName)) {
          issues.push(
            this.createIssue(
              'channel',
              `Double close on channel '${channelName}' (previously closed at line ${closedChannels.get(channelName)})`,
              filePath,
              i + 1,
              0,
              'critical',
              'channel-misuse-detector'
            )
          );
        } else {
          closedChannels.set(channelName, i + 1);
        }
      }
    }
  }

  /**
   * Detect operations on nil channels
   */
  private detectNilChannelOperations(
    lines: string[],
    filePath: string,
    issues: GoIssue[]
  ): void {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Pattern: var ch chan Type (without make)
      if (/var\s+(\w+)\s+chan\s+\w+/.test(line) && !/make/.test(line)) {
        const varMatch = line.match(/var\s+(\w+)\s+chan/);
        if (varMatch) {
          const channelName = varMatch[1];
          
          // Check for operations on this nil channel
          for (let j = i + 1; j < lines.length; j++) {
            const nextLine = lines[j];
            if (new RegExp(`${channelName}\\s*<-|<-\\s*${channelName}|close\\s*\\(\\s*${channelName}`).test(nextLine)) {
              issues.push(
                this.createIssue(
                  'channel',
                  `Operation on nil channel '${channelName}' will block forever`,
                  filePath,
                  j + 1,
                  0,
                  'critical',
                  'channel-misuse-detector'
                )
              );
              break;
            }
          }
        }
      }
    }
  }

  /**
   * Detect range over channel without close
   */
  private detectRangeWithoutClose(
    content: string,
    lines: string[],
    filePath: string,
    issues: GoIssue[]
  ): void {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const rangeMatch = line.match(/for\s+.*\s+range\s+(\w+)/);
      
      if (rangeMatch) {
        const channelName = rangeMatch[1];
        
        // Check if this channel is ever closed in the file
        const closePattern = new RegExp(`close\\s*\\(\\s*${channelName}\\s*\\)`);
        if (!closePattern.test(content)) {
          issues.push(
            this.createIssue(
              'channel',
              `Range over channel '${channelName}' without close() - loop will hang`,
              filePath,
              i + 1,
              0,
              'high',
              'channel-misuse-detector'
            )
          );
        }
      }
    }
  }
}
