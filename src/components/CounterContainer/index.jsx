import React from "react";
import { Box, List, ListItem, ListItemAvatar, ListItemText, Typography, Avatar, Stack } from '@mui/material';
import PermIdentityIcon from '@mui/icons-material/PermIdentity';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { Image } from "components";
import PersonIcon from "assets/PersonIcon.svg";
import LocationIcon from "assets/LocationIcon.svg";
import TradingIcon from "assets/TradingIcon.svg";
import TimeIcon from "assets/TimeIcon.svg";

const iconMap = {
  PersonIcon,
  LocationIcon,
  TradingIcon,
  TimeIcon
};

const Component = (props) => {

    const { id, selected, count, trendingValue, trendingUpLabel, trendingDownLabel, title, onItemSeleted, Icon } = props;

    let trendingUp = !trendingValue.toString().startsWith("-");

    const trendingColor = trendingUp ? "#00B69B" : "#F93C65";
    const borderColor = selected === id ? '#624DE3' : '#E7E7E7';

    const trendingLabel = trendingUp ? `${trendingUpLabel}` : `${trendingDownLabel}`;

    const trendingIcon = trendingUp ? <TrendingUpIcon sx={{ color: trendingColor }} /> : <TrendingDownIcon sx={{ color: trendingColor }} />;

    const OnItemSelected = (e) => {
        e.preventDefault();
        if (onItemSeleted) onItemSeleted(id);
    }

    return (

        <>
            <Box sx={{
                width: 260,
                //backgroundColor: "#ffffff",
                border: "1px solid",
                borderColor,
                boxShadow: "6px 6px 54px 0px #0000000D",
                borderRadius: 2,
                cursor: "pointer",
                backgroundColor: "##FFFFFF",
                padding: 2,
            }} onClick={OnItemSelected}>
                <List sx={{ width: '100%', maxWidth: 260, height: '100%', p: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', }}>
                    <ListItem alignItems="flex-start" sx={{ p: 0 }}>
                        <ListItemText
                            primary={
                                <React.Fragment>
                                    <Typography
                                        sx={{
                                            display: 'inline',
                                            opacity: "70%",
                                            color: "#202224",
                                            fontFamily: "Montserrat",
                                            fontSize: "14px",
                                            fontWeight: "600",
                                            lineHeight: "24px",
                                            textAlign: "left"
                                        }}
                                        component="span"
                                    >
                                        {title}
                                    </Typography>
                                </React.Fragment>
                            }
                            secondary={
                                <React.Fragment>
                                    <Typography
                                        sx={{
                                            display: 'inline',
                                            fontFamily: "Montserrat",
                                            fontSize: "24px",
                                            fontWeight: "700",
                                            lineHeight: "42px",
                                            textAlign: "left",
                                            letterSpacing: "1px",
                                            color: "#202224"
                                        }}
                                        component="span"
                                    >
                                        {count}
                                    </Typography>
                                </React.Fragment>
                            }
                        />
                        <ListItemAvatar>
                            <Avatar alt={Icon} sx={{ backgroundColor: 'unset' }}>
                                <Image src={iconMap[Icon]} />
                            </Avatar>
                        </ListItemAvatar>
                    </ListItem>
                    <ListItem alignItems="flex-start" sx={{ p: 0, mt: 'auto' }}>
                        <ListItemText>
                            <Stack sx={{
                                display: "flex",
                                alignItems: "center",
                                fontFamily: "Montserrat",
                                fontSize: "14px",
                                fontWeight: "600",
                                lineHeight: "24px"

                            }} direction={"row"} spacing={1}>
                                {trendingIcon}
                                <Typography
                                    sx={{
                                        display: 'inline',
                                        color: trendingColor,
                                        fontFamily: "Montserrat",
                                        fontSize: "14px",
                                        fontWeight: "600",
                                    }}
                                >
                                    {trendingValue}
                                </Typography>
                                <Typography
                                    sx={{
                                        display: 'inline',
                                        opacity: "70%",
                                        fontFamily: "Montserrat",
                                        fontSize: "14px",
                                        fontWeight: "600",
                                        lineHeight: "24px",
                                        textAlign: "left",
                                        color: "#202224"
                                    }}
                                >
                                    {trendingLabel}
                                </Typography>
                            </Stack>
                        </ListItemText>
                    </ListItem>
                </List>
            </Box>
        </>

    );

};

export default Component;