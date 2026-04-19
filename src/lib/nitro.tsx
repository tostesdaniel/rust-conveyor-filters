import Script from "next/script";

export function Nitro() {
  return (
    <>
      <Script
        id='nitro-ads-bootstrap'
        data-cfasync='false'
      >{`window.nitroAds=window.nitroAds||{createAd:function(){return new Promise(e=>{window.nitroAds.queue.push(["createAd", arguments, e])})},addUserToken:function(){window.nitroAds.queue.push(["addUserToken", arguments])},queue:[]};`}</Script>
      <Script
        data-cfasync='false'
        data-spa='auto'
        src='https://s.nitropay.com/ads-2322.js'
      />
    </>
  );
}
