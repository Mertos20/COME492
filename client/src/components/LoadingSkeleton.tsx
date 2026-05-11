import { Box, Skeleton, Grid, Paper, Typography } from "@mui/material";

interface LoadingSkeletonProps {
  type?: "dashboard" | "table" | "cards";
}

export default function LoadingSkeleton({ type = "dashboard" }: LoadingSkeletonProps) {
  if (type === "dashboard") {
    return (
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Skeleton variant="text" width={200} height={40} sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
            <Skeleton variant="text" width={150} height={20} sx={{ bgcolor: 'rgba(255,255,255,0.05)' }} />
          </Box>
          <Skeleton variant="circular" width={40} height={40} sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
        </Box>
        
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {[1, 2, 3].map((item) => (
            <Grid xs={12} md={4} key={item}>
              <Paper sx={{ p: 3, bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 2 }}>
                <Skeleton variant="circular" width={40} height={40} sx={{ mb: 2, bgcolor: 'rgba(255,255,255,0.1)' }} />
                <Skeleton variant="text" width="60%" height={24} sx={{ mb: 1, bgcolor: 'rgba(255,255,255,0.05)' }} />
                <Skeleton variant="text" width="80%" height={36} sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
              </Paper>
            </Grid>
          ))}
        </Grid>

        <Paper sx={{ p: 3, bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 2, height: 300 }}>
          <Skeleton variant="text" width={150} height={32} sx={{ mb: 3, bgcolor: 'rgba(255,255,255,0.1)' }} />
          <Skeleton variant="rectangular" width="100%" height={200} sx={{ borderRadius: 1, bgcolor: 'rgba(255,255,255,0.05)' }} />
        </Paper>
      </Box>
    );
  }

  if (type === "table") {
    return (
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Skeleton variant="text" width={250} height={40} sx={{ mb: 1, bgcolor: 'rgba(255,255,255,0.1)' }} />
        <Skeleton variant="text" width={180} height={20} sx={{ mb: 3, bgcolor: 'rgba(255,255,255,0.05)' }} />
        <Paper sx={{ p: 0, bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' }}>
          <Box sx={{ p: 2, borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: 2 }}>
            <Skeleton variant="rounded" width="25%" height={36} sx={{ bgcolor: 'rgba(255,255,255,0.05)' }} />
            <Skeleton variant="rounded" width="25%" height={36} sx={{ bgcolor: 'rgba(255,255,255,0.05)' }} />
            <Skeleton variant="rounded" width="25%" height={36} sx={{ bgcolor: 'rgba(255,255,255,0.05)' }} />
          </Box>
          {[1, 2, 3, 4, 5].map((item) => (
            <Box key={item} sx={{ p: 2, borderBottom: '1px solid rgba(255,255,255,0.02)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Skeleton variant="circular" width={32} height={32} sx={{ bgcolor: 'rgba(255,255,255,0.05)' }} />
                <Box>
                  <Skeleton variant="text" width={100} height={20} sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
                  <Skeleton variant="text" width={60} height={16} sx={{ bgcolor: 'rgba(255,255,255,0.05)' }} />
                </Box>
              </Box>
              <Skeleton variant="text" width={80} height={24} sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
            </Box>
          ))}
        </Paper>
      </Box>
    );
  }

  // cards type
  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Skeleton variant="text" width={250} height={40} sx={{ mb: 1, bgcolor: 'rgba(255,255,255,0.1)' }} />
      <Skeleton variant="text" width={180} height={20} sx={{ mb: 3, bgcolor: 'rgba(255,255,255,0.05)' }} />
      <Grid container spacing={3}>
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <Grid xs={12} sm={6} md={4} key={item}>
            <Paper sx={{ p: 3, bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Skeleton variant="circular" width={40} height={40} sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
                  <Box>
                    <Skeleton variant="text" width={80} height={24} sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
                    <Skeleton variant="text" width={120} height={16} sx={{ bgcolor: 'rgba(255,255,255,0.05)' }} />
                  </Box>
                </Box>
              </Box>
              <Skeleton variant="text" width="100%" height={32} sx={{ mb: 2, bgcolor: 'rgba(255,255,255,0.1)' }} />
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Skeleton variant="rounded" width="50%" height={36} sx={{ bgcolor: 'rgba(255,255,255,0.05)' }} />
                <Skeleton variant="rounded" width="50%" height={36} sx={{ bgcolor: 'rgba(255,255,255,0.05)' }} />
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
