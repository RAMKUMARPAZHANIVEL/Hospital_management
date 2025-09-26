import React from 'react'
import { Card, CardContent, Typography, Box, Avatar } from '@mui/material';
import { ImageNotSupported as ImageNotSupportedIcon } from '@mui/icons-material';

const Component = (props) => {
  const { row } = props;

  return (
    <Card 
        sx={{ width: '80%', border: "1px solid #9E9E9E", borderRadius: 2, p: 2, display: 'flex', gap: 2, boxShadow: 'unset' }}
    >
        <Box sx={{ position: 'relative' }}>
            <Avatar variant="rounded" src={row?.logo} alt="Travis Howard" 
                sx={{ width: 171, height: 171, borderRadius: 2 }}
            >
                <ImageNotSupportedIcon />
            </Avatar>
        </Box>
        <CardContent sx={{ p: 0, flex: 1 }}>
            <Typography variant="subtitle1" fontWeight={600}> {row.prop1} </Typography>
            <Typography variant="body2" fontWeight={500} mb={1}> {row.prop2} </Typography>
            <Typography variant="body2" fontWeight={500} mb={1} mt={3} > {row.prop3} </Typography>
            <Typography variant="body2" fontWeight={500}>{ row.prop4} </Typography>
            <Typography variant="subtitle2" fontWeight={600} mt={2}>
                {row.prop5} <span style={{ marginLeft: '40px'}}> {row.prop6} </span>
            </Typography>
        </CardContent>
    </Card>
  )
}

export default Component;