import { Box, Typography, Paper } from "@mui/material";
import { ReactNode } from "react";
import { SearchOff, FilterAltOff, NotInterested } from "@mui/icons-material";

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: "search" | "filter" | "empty";
  action?: ReactNode;
  height?: number | string;
}

export default function EmptyState({ 
  title = "Veri Bulunamadı", 
  description = "Arama kriterlerinize uygun sonuç bulunmuyor.", 
  icon = "empty",
  action,
  height = 300 
}: EmptyStateProps) {

  const renderIcon = () => {
    switch(icon) {
      case "search": return <SearchOff sx={{ fontSize: 64, color: 'rgba(255,255,255,0.1)' }} />;
      case "filter": return <FilterAltOff sx={{ fontSize: 64, color: 'rgba(255,255,255,0.1)' }} />;
      default: return <NotInterested sx={{ fontSize: 64, color: 'rgba(255,255,255,0.1)' }} />;
    }
  };

  return (
    <Paper sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height, 
      bgcolor: 'rgba(255,255,255,0.02)', 
      border: '1px dashed rgba(255,255,255,0.1)', 
      borderRadius: 2,
      p: 4,
      textAlign: 'center'
    }}>
      <Box sx={{ mb: 2, animation: 'pulse 3s infinite ease-in-out' }}>
        {renderIcon()}
      </Box>
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: 'text.primary' }}>
        {title}
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 400, mb: action ? 3 : 0 }}>
        {description}
      </Typography>
      {action && (
        <Box sx={{ mt: 2 }}>
          {action}
        </Box>
      )}
    </Paper>
  );
}
