import React from "react";
import { Typography, Box, Paper, Stack, Button, Chip } from '@mui/material';
import { List, ListItem, ListItemText, ListItemAvatar, Avatar, Divider } from '@mui/material';
import ImageNotSupportedIcon from '@mui/icons-material/ImageNotSupported';
import { ROWSPERPAGE } from "config";
import { styled } from '@mui/material/styles';

const Item = styled(Paper)(({ theme }) => ({
    backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
    ...theme.typography.body2,
    padding: theme.spacing(1),
    textAlign: 'center',
    color: theme.palette.text.secondary,
}));

const CustomPagination = (props) => {

    const { page, pageSize, rowCount, onPageChange } = props;
 
    const handlePageChange = (newPage) => {
        onPageChange(newPage);
    };
    
    return (
        <Box
        sx={{ display: 'flex', justifyContent: 'center', gap: 1.5, my: 2, alignItems: 'center', width: "100%" }}
        >
        <Button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 0}
                sx={{ 
                textTransform: 'none', fontSize: '12px', color: page === 0 ? '#aaa' : 'primary.main', bgcolor: 'transparent', minWidth: 'auto', borderRadius: "8px",         
                '&:hover': {
                    color: '#fff',
                    bgcolor: 'primary.main'
                },
                }}
            >
            Previous
        </Button>
    
        {Array.from({ length: Math.ceil(rowCount/pageSize) })
        .slice(0, 5)
        .map((_, i) => (
            <Button
            key={i}
            onClick={() => handlePageChange(i)}
            sx={{ 
                width: 32, height: 32, minWidth: 0, padding: 0, fontSize: '12', borderRadius: '8px', fontWeight: 500,
                backgroundColor: page === i ? 'primary.main' : '#e0e0e0',
                color: page === i ? '#fff' : '#333',
                '&:hover': {
                backgroundColor: page === i ? 'primary.main' : '#d5d5d5',
                },
            }}
            >
            {i + 1}
            </Button>
        ))}
    
        <Button
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= Math.ceil(rowCount/pageSize) - 1}
                sx={{ 
                textTransform: 'none', fontSize: '12px', color: page >= pageSize - 1 ? '#aaa' : 'primary.main', bgcolor: 'transparent', minWidth: 'auto', borderRadius: "8px",
                '&:hover': {
                    color: 'secondary.main',
                    bgcolor: 'primary.main'
                },
                }}
            >
            Next
        </Button>
        </Box>
    );
}

const Component = (props) => {

    const { rowsCount, rows, pageInfo, onPageClicked, getChipStyle, onActionClicked } = props;

    const handleChangePage = (newPage) => {
        const _page = { page: newPage, pageSize: pageInfo.pageSize };
        if (onPageClicked) onPageClicked(_page);
    };

    const handleChangeRowsPerPage = (event) => {
        /* setPageInfo({ page: 0, pageSize: parseInt(event.target.value, 5) }); */
    };

    const GetChipStyle = (value) => {
       if(getChipStyle) return getChipStyle(value);
    }

    const OnActionClicked = (id, type) => {
        if (onActionClicked) onActionClicked(id, type);
    };

    return (
        <>
            <List dense={true} sx={{ width: '100%', gap: 4, display: 'flex', flexWrap: 'wrap' }}>
                {rows && rows.map((x, index) => (
                    <React.Fragment key={index}>
                        <ListItem alignItems="flex-start" sx={{  
                              width: 'calc(50% - 16px)', border: "1px solid #9E9E9E", borderRadius: 2, gap: 2, p: '10px',
                              ":hover" : { borderColor : "#E4E4E4", cursor: "pointer" }
                            }} onClick={() => OnActionClicked(x.id, 'view')}>
                            <ListItemAvatar sx={{ m: 0 }}>
                                <Avatar alt="Travis Howard" src={x.logo} sx={{ width: 125, height: 125, borderRadius: 2 }}><ImageNotSupportedIcon /></Avatar>
                            </ListItemAvatar>
                            <ListItemText sx={{ width: "100%" }}
                                primary={
                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                        <Typography variant="p" component="span" sx={{  fontWeight: "600" }}>
                                            {x.prop1}
                                        </Typography>
                                        {x.prop2 && ( <Chip label={x.prop2?.toString() || "Unknown"} sx={GetChipStyle(x.prop2?.toString())} /> )}
                                    </Stack>
                                }
                                secondary={
                                    <React.Fragment>
                                        <Typography component="p" variant="body2" sx={{ fontWeight: "500", mb: 1}}>
                                            {x.prop3}
                                        </Typography>
                                        <Typography component="span" variant="body2" sx={{ fontWeight: "500"}}>
                                            {x.prop4}
                                        </Typography>
                                         <Typography variant="p" component="div" sx={{ fontWeight: "600", mt: 2 }}>
                                            {x.prop5}
                                        </Typography>
                                    </React.Fragment>
                                } 
                            />
                        </ListItem>
                    </React.Fragment>
                ))}
            </List>
            {/* {rows && rows.map((x, index) => (
                <CardItem key={index} keyid={x.Product_id} title={x.Name} imgsrc={x.ProductMainImageData} width={300}
                    description={x.Product_description} onActionClicked={OnActionClicked} productStatus={x.ProductStatus} >
                    <Grid container direction="column">
                        <Typography variant="caption" color="text.secondary">
                            <strong>Type:</strong>&nbsp;{x.ProductTypeName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            <strong>Price:</strong>&nbsp;?{x.ProductPrice}
                        </Typography>
                    </Grid>
                </CardItem>
            ))} */}
            {/* </GridContainer> */}
            {rows && rows.length > 0 && <CustomPagination
                    page={pageInfo.page}
                    pageSize={pageInfo.pageSize}
                    rowCount={rowsCount}
                    onPageChange={handleChangePage}
                />}
        </>
    );

};

export default Component;
