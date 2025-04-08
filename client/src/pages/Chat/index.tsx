import { Box, Typography } from '@mui/material';

const Chat = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        AIチャット
      </Typography>
      <Typography variant="body1">
        準備中...
      </Typography>
    </Box>
  );
};

export default Chat;