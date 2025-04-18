import React, { useState, useEffect, useCallback, useRef } from 'react';
import Map from './components/Map';
import axios from 'axios';
import 'mapbox-gl/dist/mapbox-gl.css';
import { createLogger, LOG_LEVELS } from './utils/logging';

axios.defaults.withCredentials = true;

// Create a logger for the App component
const logger = createLogger('App');

function App() {
  logger.verbose('Component function called');
  const [articles, setArticles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const isUpdatingRef = useRef(false);
  const articlesRef = useRef([]);

  const fetchArticles = useCallback(async () => {
    logger.debug('fetchArticles called, isUpdatingRef:', isUpdatingRef.current);
    if (isUpdatingRef.current) {
      logger.debug('Skipping fetch due to article update');
      return;
    }
    logger.debug('Proceeding with fetchArticles');
    setIsLoading(true);
    setError(null);
    try {
      logger.debug('Sending GET request to /DC.json');
      const response = await axios.get('/DC.json');
      logger.debug('Received response from /DC.json');
      if (Array.isArray(response.data)) {
        logger.info('Setting articles, length:', response.data.length);
        setArticles(response.data);
        articlesRef.current = response.data;
      } else {
        throw new Error('Received data is not an array');
      }
    } catch (error) {
      logger.error('Error fetching articles:', error);
      setError(error.message || 'An error occurred while fetching articles');
    } finally {
      logger.debug('Setting isLoading to false');
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    logger.verbose('useEffect triggered');
    fetchArticles();
  }, [fetchArticles]);

  const handleArticleUpdate = useCallback((updatedArticle) => {
    if (updatedArticle === null) {
      logger.debug('Closing popup, no article selected');
      return;
    }
    if (!updatedArticle || !updatedArticle.location) {
      logger.warn('Invalid updatedArticle received:', updatedArticle);
      return;
    }
    logger.debug('handleArticleUpdate called with:', updatedArticle.location.address);
    isUpdatingRef.current = true;
    logger.verbose('Set isUpdatingRef to true');
    setArticles(prevArticles => {
      const newArticles = prevArticles.map(article =>
        article.location.address === updatedArticle.location.address ? updatedArticle : article
      );
      articlesRef.current = newArticles;
      logger.debug('Articles updated');
      return newArticles;
    });
    setTimeout(() => {
      logger.verbose('Resetting isUpdatingRef to false');
      isUpdatingRef.current = false;
    }, 0);
  }, []);

  logger.verbose('Rendering App component, isLoading:', isLoading, 'error:', error);

  return (
    <div>
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <Map articles={articlesRef.current} onArticleUpdate={handleArticleUpdate} />
      )}
      {error && <p>Error: {error}</p>}
    </div>
  );
}

export default App;
