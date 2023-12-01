/*
 *
 * HomePage
 *
 */

import React, {useState, useEffect} from 'react';
// import PropTypes from 'prop-types';
import { LoadingIndicatorPage } from '@strapi/helper-plugin';
import pluginPkg from '../../../../package.json';
import { Typography } from '@strapi/design-system/Typography';
import { Button } from '@strapi/design-system/Button';
import { BaseHeaderLayout, ContentLayout } from '@strapi/design-system/Layout';
import { Grid, GridItem } from '@strapi/design-system/Grid';
import Trash from '../../components/TrashIcon';
import cachePurgeRequests from '../../api/cache-request';
const name = "Purge Cache";

const HomePage = () => {
  const [isButton1Loading, setIsButton1Loading] = useState(false);
  const [isButton2Loading, setIsButton2Loading] = useState(false);
  const [isButton3Loading, setIsButton3Loading] = useState(false);
//  if (isLoading) return <LoadingIndicatorPage/>;
  const handleSubmit = async (cache_type) =>{
  let res = {};
    if(cache_type === 'short_cache'){
      setIsButton1Loading(true);
      res = await cachePurgeRequests.short_cache();
      setIsButton1Loading(false);
    } else if(cache_type === 'purge_all'){
      setIsButton2Loading(true);
      res = await cachePurgeRequests.purge_all();
      setIsButton2Loading(false);
    } else if(cache_type === 'purge_cdn'){
      setIsButton3Loading(true);
      res = await cachePurgeRequests.purge_cdn();
      setIsButton3Loading(false);
    }
  };
  return (
    <>
     <BaseHeaderLayout
        title={name}
        subtitle="Clear Website Cache"
        as="h2"
      />
      <ContentLayout>
      <Typography variant="delta" as="h2"></Typography>
      <Grid gap={6}>
        
        <GridItem col={6} s={6}>
         <Typography variant="delta" as="h2">1. Clear content related short cache.</Typography>        
        </GridItem>
        <GridItem col={4} s={4}>
            <Button
              onClick={() => handleSubmit('short_cache')}
              startIcon={<Trash />}
              size="M"
              disabled={isButton1Loading}
              loading={isButton1Loading}
            >
              Clear
            </Button>
        </GridItem>   
      
        <GridItem col={6} s={6}>  
          <Typography variant="delta" as="h2">2. Clear all website cache, website will have a peformance hit before cache regenerated.</Typography>        
        </GridItem>
        <GridItem col={4} s={4}>
      <Button
              onClick={() => handleSubmit('purge_all')}
              startIcon={<Trash />}
              size="M"
              disabled={isButton2Loading}
              loading={isButton2Loading}
            >
              Clear
            </Button>
        </GridItem>  
        <GridItem col={6} s={6}>  
          <Typography variant="delta" as="h2">3. Clear AWS CDN cache for all pages and assets. It may takes up to 10 mins. </Typography>        
        </GridItem>
        <GridItem col={4} s={4}>
      <Button
              onClick={() => handleSubmit('purge_cdn')}
              startIcon={<Trash />}
              size="M"
              disabled={isButton3Loading}
              loading={isButton3Loading}
            >
              Clear
            </Button>
        </GridItem>  
      </Grid>
     
      </ContentLayout>
    </>
  );
};

export default HomePage;
