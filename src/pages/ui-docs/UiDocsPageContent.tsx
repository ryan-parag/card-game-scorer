import React from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { docsRegistry } from './registry';

export const UiDocsPageContent: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const entry = docsRegistry.find((item) => item.slug === slug);

  if (!entry) {
    return <Navigate to="/ui" replace />;
  }

  const { Component } = entry;
  return <Component />;
};
