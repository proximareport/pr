import React from 'react';
import SimpleEditor from './SimpleEditor';

// Make the ArticleEditor component a simple wrapper around SimpleEditor
// This ensures we don't break existing code that imports ArticleEditor
export default function ArticleEditor(props: any) {
  return <SimpleEditor {...props} />;
}