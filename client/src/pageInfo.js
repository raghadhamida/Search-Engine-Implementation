import { Box } from '@mui/material'
import React from 'react'

const PageInfo = ({page}) => {
  let words = page.content.split('\n');
  const wordFrequencyMap = new Map();

  for(let i = 0; i < words.length; i++){
    if (words[i] != ''){
      if(wordFrequencyMap.has(words[i])){
        let freq = wordFrequencyMap.get(words[i]);
        freq += 1;
        wordFrequencyMap.set(words[i], freq);
      }
      else {
        wordFrequencyMap.set(words[i], 1);
      }
    }
  }

  return (
    <Box margin={1}>
        <h2>{page.title}</h2>
        <h3>{page.url}</h3>
        <h3>Word Frequency</h3>
        {Array.from(wordFrequencyMap).map((w) => 
          <div>{w[0] + ': ' + w[1]}</div>
        )}
        <h4>Outgoing Links:</h4>
        {page.outGoingLinks.map((l) => 
            <div>{l}</div>
            )}
        <h4>Incoming Links:</h4>
        {page.incomingLinks.map((l) => 
            <div>{l}</div>
        )}
    </Box>
  )
}

export default PageInfo