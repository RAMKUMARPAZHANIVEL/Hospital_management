import React from 'react'
import { Card, CardMedia, CardContent, Typography, Box, Chip, Avatar, CardActionArea, CardActions, Button } from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import { ImageNotSupported as ImageNotSupportedIcon } from '@mui/icons-material';

const Component = (props) => {
  const { row, onActionClicked } = props;

  const OnActionClicked = (id, type, childId) => {
    if(onActionClicked) onActionClicked(id, type, childId);
  }

  return (
    <Card 
        sx={{ 
            width: 'calc(50% - 16px)', 
            border: "1px solid #E7E7E7", 
            borderRadius: 2, 
            p: 2, 
            display: 'flex', 
            gap: 2, 
        }}
        >
        <Box sx={{ position: 'relative' }}>
            <Avatar 
                variant="rounded" 
                src={row?.logo} 
                alt="Travis Howard" 
                sx={{ width: 171, height: 171, borderRadius: 2 }}
            >
            <ImageNotSupportedIcon />
            </Avatar>

            {/* {row.prop7 && (
                <Chip
                    label={row.prop7?.toString() || "Unknown"}
                    sx={{ 
                    position: 'absolute', 
                    bottom: -10, 
                    left: 0, 
                    ...GetChipStyle(row.prop7?.toString()) 
                    }}
                    icon={
                      <StarIcon style={{ color: GetChipStyle(row.prop7?.toString()).color }} />
                    }
                />
            )} */}
        </Box>
        <Box sx={{ width: '100%' }}>
            <CardContent sx={{ p: 0, flex: 1 }}>
                <Typography variant="subtitle1" fontWeight={600}>
                {row.prop1}
                </Typography>
                <Typography variant="body2" fontWeight={500} mb={1}>
                {row.prop2}
                </Typography>
                <Typography variant="body2" fontWeight={500} mb={1}>
                {row.prop3}
                </Typography>
                <Typography variant="body2" fontWeight={500}>
                {row.prop4}
                </Typography>
                <Typography variant="subtitle2" fontWeight={600} mt={2}>
                 {row.prop5}
                </Typography>
            </CardContent>
            <CardActions sx={{ px: 0 }}>
                <Button variant="contained" 
                    sx={{ width: "100%", borderRadius : 2, fontSize: 12, fontWeight: 700, height: 32, textTransform: "unset", bgcolor: "primary.main" }}
                    onClick={() => OnActionClicked(row.id, 'view', row.childId)}
                >
                    View Details
                </Button>
            </CardActions>
        </Box>
    </Card>
  )
}

export default Component;