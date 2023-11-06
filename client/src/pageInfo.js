import { Box } from '@mui/material'
import { Container } from '@mui/system';
import React from 'react'

const PageInfo = ({page, type}) => {
  let words;
  if(type == "fruit"){
    words = page.content.split('\n');
  }
  else{
    words = page.content.split(' ');
  }
  
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
        <Box height='150px' alignSelf='center' sx={{outline: 'solid 1px', overflow: 'auto'}}>
          {Array.from(wordFrequencyMap).map((w) => 
            <div>{w[0] + ': ' + w[1]}</div>
          )}
        </Box>
        <h4>Outgoing Links:</h4>
        <Box height='150px' alignSelf='center' sx={{outline: 'solid 1px', overflow: 'auto'}}>
          {page.outGoingLinks.map((l) => 
              <div>{l}</div>
              )}
        </Box>
        <h4>Incoming Links:</h4>
        <Box height='150px' alignSelf='center' sx={{outline: 'solid 1px', overflow: 'auto'}}>
          {page.incomingLinks.map((l) => 
              <div>{l}</div>
          )}
        </Box>
    </Box>
  )
}

export default PageInfo