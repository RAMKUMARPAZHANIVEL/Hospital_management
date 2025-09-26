import React from "react";
import { Box, Typography, Container } from "@mui/material";
import principles_Poster from "../../assets/principles.svg";
import { Image } from "components";

const Component = (props) => {

  return (
    <Container maxWidth="sm">
        <Box
            elevation={3}
            sx={{ p: 4, textAlign: "center", borderRadius: 3, mt: 5, }}
        >
            <Image
                src={principles_Poster}
                alt="Application Under Review"
                sx={{ width: "100%", maxWidth: 477, mb: 3, }}
            />

            <Typography
                variant="h5"
                component="h2"
                sx={{ fontWeight: 600, color: "primary.main", mb: 2 }}
            >
               Your Application Is Under Review
            </Typography>

            <Typography variant="body2" sx={{ mt: 1, fontWeight: 500 }}>
                Thank you for applying to join the platform. Our team is currently
                reviewing your details and credentials to ensure a safe and trusted
                experience for all users.
            </Typography>

            <Typography variant="body2" sx={{ mt: 1, fontWeight: 500 }}>
               You’ll be notified once your profile is approved and ready to go live.
            </Typography>
        </Box>
    </Container>
  );
};

export default Component;
