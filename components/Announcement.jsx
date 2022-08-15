const AnnouncementComponent = ({ announcement, mobile }) => {
  return (
    <div className="">
      <div className="w-full text-white font-bold py-2 px-4 drop-shadow-lg bg-pink text-center">
        <p>
        {announcement}
        </p>
        {mobile ? <></> : (<br/>)}
      </div>
    </div>
  );
};

export default AnnouncementComponent;
