/**
 * src/context/utils/links.ts
 * Enhanced SharePoint link builders with smart URL handling
 */

import type { LinkBuilder, FileLinks, ListItemLinks, SiteLinks } from './types';

/**
 * SharePoint link builder implementation
 */
export class SPFxLinkBuilder implements LinkBuilder {
  constructor(private readonly webAbsoluteUrl: string, private readonly webRelativeUrl: string) {}

  readonly file: FileLinks = {
    absolute: (fileUrlOrPath: string): string => {
      return this.normalizeToAbsolute(fileUrlOrPath);
    },

    download: (fileUrlOrPath: string): string => {
      const absoluteUrl = this.normalizeToAbsolute(fileUrlOrPath);
      return this.addQueryParam(absoluteUrl, 'download', '1');
    },

    browserView: (fileUrlOrPath: string): string => {
      const absoluteUrl = this.normalizeToAbsolute(fileUrlOrPath);
      const encodedUrl = encodeURIComponent(absoluteUrl);
      return `${this.trimSlash(
        this.webAbsoluteUrl
      )}/_layouts/15/WopiFrame.aspx?sourcedoc=${encodedUrl}&action=view`;
    },

    browserEdit: (fileUrlOrPath: string): string => {
      const absoluteUrl = this.normalizeToAbsolute(fileUrlOrPath);
      const encodedUrl = encodeURIComponent(absoluteUrl);
      return `${this.trimSlash(
        this.webAbsoluteUrl
      )}/_layouts/15/WopiFrame.aspx?sourcedoc=${encodedUrl}&action=edit`;
    },

    oneDrivePreview: (fileUrlOrPath: string): string => {
      const absoluteUrl = this.normalizeToAbsolute(fileUrlOrPath);
      const encodedUrl = encodeURIComponent(absoluteUrl);
      return `${this.trimSlash(
        this.webAbsoluteUrl
      )}/_layouts/15/WopiFrame.aspx?sourcedoc=${encodedUrl}&action=interactivepreview&wdSmallView=1`;
    },

    openInClient: (fileUrlOrPath: string): string => {
      const absoluteUrl = this.normalizeToAbsolute(fileUrlOrPath);
      const clientScheme = this.getClientScheme(absoluteUrl);
      return clientScheme
        ? `${clientScheme}${absoluteUrl}`
        : this.addQueryParam(absoluteUrl, 'web', '0');
    },

    versionHistory: (listId: string, itemId: number): string => {
      const encodedListId = encodeURIComponent(listId);
      return `${this.trimSlash(
        this.webAbsoluteUrl
      )}/_layouts/15/VersionHistory.aspx?list=${encodedListId}&ID=${itemId}`;
    },
  };

  readonly listItem: ListItemLinks = {
    display: (listUrl: string, itemId: number, source?: string): string => {
      const absoluteListUrl = this.normalizeToAbsolute(listUrl);
      const baseUrl = `${this.trimSlash(absoluteListUrl)}/DispForm.aspx?ID=${itemId}`;
      return source ? `${baseUrl}&Source=${encodeURIComponent(source)}` : baseUrl;
    },

    edit: (listUrl: string, itemId: number, source?: string): string => {
      const absoluteListUrl = this.normalizeToAbsolute(listUrl);
      const baseUrl = `${this.trimSlash(absoluteListUrl)}/EditForm.aspx?ID=${itemId}`;
      return source ? `${baseUrl}&Source=${encodeURIComponent(source)}` : baseUrl;
    },

    newItem: (listUrl: string, source?: string): string => {
      const absoluteListUrl = this.normalizeToAbsolute(listUrl);
      const baseUrl = `${this.trimSlash(absoluteListUrl)}/NewForm.aspx`;
      return source ? `${baseUrl}?Source=${encodeURIComponent(source)}` : baseUrl;
    },

    modernDisplay: (listId: string, itemId: number, source?: string): string => {
      const encodedListId = encodeURIComponent(listId);
      const baseUrl = `${this.trimSlash(
        this.webAbsoluteUrl
      )}/_layouts/15/listform.aspx?PageType=4&ListId=${encodedListId}&ID=${itemId}`;
      return source ? `${baseUrl}&Source=${encodeURIComponent(source)}` : baseUrl;
    },

    modernEdit: (listId: string, itemId: number, source?: string): string => {
      const encodedListId = encodeURIComponent(listId);
      const baseUrl = `${this.trimSlash(
        this.webAbsoluteUrl
      )}/_layouts/15/listform.aspx?PageType=6&ListId=${encodedListId}&ID=${itemId}`;
      return source ? `${baseUrl}&Source=${encodeURIComponent(source)}` : baseUrl;
    },

    modernNew: (listId: string, source?: string): string => {
      const encodedListId = encodeURIComponent(listId);
      const baseUrl = `${this.trimSlash(
        this.webAbsoluteUrl
      )}/_layouts/15/listform.aspx?PageType=8&ListId=${encodedListId}`;
      return source ? `${baseUrl}&Source=${encodeURIComponent(source)}` : baseUrl;
    },
  };

  readonly site: SiteLinks = {
    home: (): string => {
      return this.trimSlash(this.webAbsoluteUrl);
    },

    contents: (): string => {
      return `${this.trimSlash(this.webAbsoluteUrl)}/_layouts/15/viewlsts.aspx`;
    },

    settings: (): string => {
      return `${this.trimSlash(this.webAbsoluteUrl)}/_layouts/15/settings.aspx`;
    },

    recycleBin: (): string => {
      return `${this.trimSlash(this.webAbsoluteUrl)}/_layouts/15/RecycleBin.aspx`;
    },
  };

  uploadTo(libraryUrl: string): string {
    const absoluteLibraryUrl = this.normalizeToAbsolute(libraryUrl);
    return `${this.trimSlash(absoluteLibraryUrl)}/Forms/AllItems.aspx?upload=1`;
  }

  listSettings(listId: string): string {
    const encodedListId = encodeURIComponent(listId);
    return `${this.trimSlash(this.webAbsoluteUrl)}/_layouts/15/listedit.aspx?List=${encodedListId}`;
  }

  forSite(siteUrl: string): Pick<LinkBuilder, 'file' | 'listItem'> {
    // Create a new builder instance for the target site
    const targetBuilder = new SPFxLinkBuilder(siteUrl, this.extractRelativePath(siteUrl));
    return {
      file: targetBuilder.file,
      listItem: targetBuilder.listItem,
    };
  }

  // Private helper methods

  private normalizeToAbsolute(urlOrPath: string): string {
    if (!urlOrPath) {
      return this.webAbsoluteUrl;
    }

    // Already absolute URL
    if (this.isAbsoluteUrl(urlOrPath)) {
      return urlOrPath;
    }

    // Server-relative path (starts with /)
    if (urlOrPath.startsWith('/')) {
      try {
        const baseUrl = new URL(this.webAbsoluteUrl);
        return `${baseUrl.protocol}//${baseUrl.host}${urlOrPath}`;
      } catch {
        return `${this.trimSlash(this.webAbsoluteUrl)}${urlOrPath}`;
      }
    }

    // Site-relative path
    const cleanWebRelative = this.trimSlash(this.webRelativeUrl);
    const cleanPath = urlOrPath.replace(/^\/+/, '');

    try {
      const baseUrl = new URL(this.webAbsoluteUrl);
      return `${baseUrl.protocol}//${baseUrl.host}${cleanWebRelative}/${cleanPath}`;
    } catch {
      return `${this.trimSlash(this.webAbsoluteUrl)}/${cleanPath}`;
    }
  }

  private isAbsoluteUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  private trimSlash(url: string): string {
    return url?.endsWith('/') ? url.slice(0, -1) : url || '';
  }

  private addQueryParam(url: string, param: string, value: string): string {
    try {
      const urlObj = new URL(url);
      urlObj.searchParams.set(param, value);
      return urlObj.toString();
    } catch {
      // Fallback for malformed URLs
      const separator = url.includes('?') ? '&' : '?';
      return `${url}${separator}${param}=${encodeURIComponent(value)}`;
    }
  }

  private getClientScheme(absoluteUrl: string): string | null {
    const extension = this.getFileExtension(absoluteUrl);

    switch (extension.toLowerCase()) {
      case 'doc':
      case 'docx':
      case 'dot':
      case 'dotx':
      case 'rtf':
        return 'ms-word:ofe|u|';

      case 'xls':
      case 'xlsx':
      case 'xlsm':
      case 'xlsb':
      case 'csv':
        return 'ms-excel:ofe|u|';

      case 'ppt':
      case 'pptx':
      case 'ppsx':
      case 'pptm':
        return 'ms-powerpoint:ofe|u|';

      case 'vsd':
      case 'vsdx':
      case 'vsdm':
        return 'ms-visio:ofe|u|';

      case 'one':
      case 'onepkg':
        return 'onenote:https://';

      default:
        return null;
    }
  }

  private getFileExtension(url: string): string {
    try {
      const pathname = new URL(url).pathname;
      const lastDot = pathname.lastIndexOf('.');
      return lastDot >= 0 ? pathname.substring(lastDot + 1) : '';
    } catch {
      // Fallback for non-URL strings
      const lastDot = url.lastIndexOf('.');
      const lastSlash = url.lastIndexOf('/');
      return lastDot > lastSlash ? url.substring(lastDot + 1) : '';
    }
  }

  private extractRelativePath(absoluteUrl: string): string {
    try {
      const url = new URL(absoluteUrl);
      return url.pathname;
    } catch {
      return '/';
    }
  }
}

/**
 * Utility functions for link operations
 */
export class LinkUtils {
  /**
   * Validates if a URL is a valid SharePoint URL
   */
  static isSharePointUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return (
        urlObj.hostname.includes('sharepoint.com') ||
        urlObj.hostname.includes('.sharepoint.') ||
        urlObj.pathname.includes('/_layouts/')
      );
    } catch {
      return false;
    }
  }

  /**
   * Extracts site collection URL from any SharePoint URL
   */
  static extractSiteCollectionUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      const pathSegments = urlObj.pathname.split('/').filter(Boolean);

      // For most SharePoint URLs: /sites/sitename or /teams/teamname
      if (
        pathSegments.length >= 2 &&
        (pathSegments[0] === 'sites' || pathSegments[0] === 'teams')
      ) {
        return `${urlObj.protocol}//${urlObj.host}/${pathSegments[0]}/${pathSegments[1]}`;
      }

      // Root site collection
      if (pathSegments.length === 0 || pathSegments[0] === '_layouts') {
        return `${urlObj.protocol}//${urlObj.host}`;
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Builds a deep link to a specific view of a list
   */
  static buildListViewUrl(
    webUrl: string,
    listId: string,
    viewId?: string,
    filter?: string
  ): string {
    const baseUrl = `${webUrl.replace(
      /\/$/,
      ''
    )}/_layouts/15/listform.aspx?PageType=0&ListId=${encodeURIComponent(listId)}`;

    const params: string[] = [];
    if (viewId) {
      params.push(`ViewId=${encodeURIComponent(viewId)}`);
    }
    if (filter) {
      params.push(`FilterField1=Title&FilterValue1=${encodeURIComponent(filter)}`);
    }

    return params.length > 0 ? `${baseUrl}&${params.join('&')}` : baseUrl;
  }

  /**
   * Creates a mailto link with SharePoint context
   */
  static createMailtoLink(options: {
    to?: string[];
    cc?: string[];
    subject?: string;
    body?: string;
    itemUrl?: string;
  }): string {
    const { to = [], cc = [], subject = '', body = '', itemUrl } = options;

    let mailBody = body;
    if (itemUrl) {
      mailBody += `\n\nSharePoint Item: ${itemUrl}`;
    }

    const params: string[] = [];
    if (cc.length > 0) {
      params.push(`cc=${encodeURIComponent(cc.join(';'))}`);
    }
    if (subject) {
      params.push(`subject=${encodeURIComponent(subject)}`);
    }
    if (mailBody) {
      params.push(`body=${encodeURIComponent(mailBody)}`);
    }

    const toList = to.length > 0 ? to.join(';') : '';
    const queryString = params.length > 0 ? `?${params.join('&')}` : '';

    return `mailto:${toList}${queryString}`;
  }

  /**
   * Sanitizes a URL for logging purposes (removes sensitive query parameters)
   */
  static sanitizeUrlForLogging(url: string): string {
    try {
      const urlObj = new URL(url);

      // Remove potentially sensitive parameters
      const sensitiveParams = [
        'access_token',
        'refresh_token',
        'code',
        'state',
        'authorization',
        'bearer',
        'apikey',
        'secret',
      ];

      sensitiveParams.forEach(param => {
        if (urlObj.searchParams.has(param)) {
          urlObj.searchParams.set(param, '[REDACTED]');
        }
      });

      return urlObj.toString();
    } catch {
      return '[Invalid URL]';
    }
  }
}
