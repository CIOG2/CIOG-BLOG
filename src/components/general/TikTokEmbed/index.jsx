const TikTokEmbed = ({ links }) => {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(325px, 1fr))',
        gap: '16px',
        justifyContent: 'center', // Centrar los elementos horizontalmente
      }}
    >


      {links.map((link) => {
        const videoId = link.split('/').pop();
        return (
          <div
            key={videoId}
            style={{
              position: 'relative',
              width: '100%',
              height: '577px', // Altura fija para el video
              overflow: 'hidden',
              display: 'flex', // Usar Flexbox para centrar
              justifyContent: 'center', // Centrar horizontalmente
              alignItems: 'center', // Centrar verticalmente
            }}
          >
            <iframe
              src={`https://www.tiktok.com/embed/${videoId}`}
              style={{
                position: 'relative',
                width: '325px', // Tamaño fijo del iframe
                height: '100%',
                border: 'none',
                overflow: 'hidden',
              }}
              allow="fullscreen"
              scrolling="no"
              loading="lazy"
            />
          </div>
        );
      })}
    </div>
  );
};

export default TikTokEmbed;
