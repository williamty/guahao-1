//使用指南：
//1.使用函数getYanzhengma，输入验证码数字，登录成功，自动欺骗
//2.输入查询条件，午别，医生，日期等执行函数choseTimeYuyue()进行预约。



var http = require("http");
var querystring = require("querystring");
var Iconv = require('iconv-lite');
var fs = require("fs");
var readline = require('readline');

var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

//------登录系统相关
//登录名,身份证,验证码,登录cookie
var truename = "张成思";
var sfzhm = "110108198712215711";
var yzm = "";
var cookie = "__c_p7M6M01bnArC78H4cai9p7M6M01bnArC78H4298u5o734=48007b0f733fe2ab0250f315b31d3516";


//------选择预约信息
//医院id,科室id,预约日期，午别（上午，下午），医生（普通，正教授，副教授），医生专长（一般专家有，比如盆底，内异症）
var hpid = "142";
var ksid = "1100101";
var yvyuedate = "2014-12-17";//预约日期，当前日期的七天后
var wubie = "上午";//上午，下午
var doctor = "教授"; //普通，正教授，副教授或者个别是姓名
var special = ""; //专业术语，比如盆底，内异症等等
// 医保卡，报销类型，就诊卡号
var ybkh = "110108198712215711";
var baoxiao = "1"; //报销类型：1-医疗保险，2-商业保险，3-公费医疗
var jiuz = "123456";

var datid;//根据选择的预约生成系统预约号

//------就医信息


var dxcode;


//1.登陆用
//getYanzhengma();



//2.预约用
console.log("医院：" + hpid);
console.log("科室：" + ksid);
console.log("预约日期：" + yvyuedate);
console.log("午别：" + wubie);
console.log("医生：" + doctor);
console.log("专长：" + special);
console.log("医保卡号：" + ybkh);
console.log("报销类型：" + baoxiao);
console.log("就诊卡号：" + jiuz);
var timer = setInterval(choseTimeYuyue, 2000);


function getYanzhengma() {
    function saveYanzhengma(buffer , resHeaders) {
        fs.writeFileSync("验证码.bmp", buffer);
        cookie = resHeaders["set-cookie"][0].split(";")[0];
        fs.writeFileSync("验证码.txt", cookie);
        rl.question("输入验证码\n ", function(input) {
        yzm = input;
        console.log("输入的是：" + yzm);
        rl.close();
        loginFunc();
    });
}
    var path = "/comm/code.php";
    var method = "GET";
    var referurl = "http://www.bjguahao.gov.cn/comm/index.html";
    sendQingqiu(path, referurl, method, null, saveYanzhengma);
}

function loginFunc() {
    var logindata = {
        "truename": truename,
        "sfzhm": sfzhm,
        "yzm": yzm
    };
    var path = "/comm/logon.php";
    var method = "POST";
    var referurl = "http://www.bjguahao.gov.cn/comm/index.html";

    function loginCheck(buf, header, str) {
        if ( str!= "" ) {
            console.log(str);
        } else {
            console.log("登陆成功");
            visitOnce();
        }

    }
    sendQingqiu(path, referurl, method, logindata, loginCheck);
}

//根据选择条件：医院，科室，挂号日期，挂号午别，专家，专家特长获取
// 1。系统预约号daid(后续用得着）
// 2。找到预约url，发送预约请求，获得填报预约人信息界面response
function visitOnce() {

    var path = "/comm/content.php?hpid="+ hpid +  "&keid=" + ksid;
    console.log(path);
    var referurl = "http://www.bjguahao.gov.cn/comm/yyks-" + hpid + ".html";
    var method = "GET";
    function nexthandle(buf, headers, str) {
        console.log("完成欺骗！");
    }
    sendQingqiu(path, referurl, method, 0, nexthandle);
}


function choseTimeYuyue() {



    var exp = ".*?" + wubie + ".*?" + doctor + ".*?" + special + ".*?'(.*?)'";
    var reg = new RegExp(exp, "g");
    var path = "/comm/ghao.php?hpid=" + hpid + "&keid=" + ksid + "&date1=" + yvyuedate;
    var method = "GET";
    var referurl = "http://www.bjguahao.gov.cn/comm/content.php";
    function getguahaourl(buffer, headers, str) {
        var aa = str.replace(/\n/g,'');
        var input = aa.match(/<tr>.*?<\/tr>/g);
        var len = input.length;
        var flag = true;
        for (var i = 0; i < len; i++) {
            var each = input[i];
            var x = each.match(reg);
            if ( x ) {
                clearInterval(timer);
                var url = RegExp.$1;
                datid  = url.match(/datid=(.*)/)[1];
                flag = false;
                enterYuyue(url.substring(1));
                break;
            }
        }
        if ( flag ) {
            console.log("not begin");
        }
    }
    sendQingqiu(path, referurl, method, 0, getguahaourl);
}

//进入预约界面
function enterYuyue(url) {

    var path = "/comm" + url;
    var method = "GET";
    var referurl = "http://www.bjguahao.gov.cn/comm/ghao.php";

    console.log("预约url:" + path);
    function sendYuyueRequest(buf) {

        var resmsg = Iconv.decode(buf, 'GBK');
        var msgurl = resmsg.match(/("..\/shortmsg.*?),/);
        var shortmsgurl = eval(RegExp.$1);
        //发送短信验证码
        sendMsg(shortmsgurl);
        //发送请求
        sendGuahao(resmsg);
    }
    sendQingqiu(path, referurl, method, 0, sendYuyueRequest);
}

function sendMsg(msgurl) {
    var path = "/comm" + msgurl.substr(2);
    var method = "GET";
    var referurl = "http://www.bjguahao.gov.cn/comm/beiyi3/guahao.php?";
    sendQingqiu(path, referurl, method, 0);
}

function sendGuahao(resmsg) {


    var postdata = {
        baoxiao : baoxiao,
        datid : datid,
        hpid : hpid,
        jiuz : jiuz,
        ksid : ksid,
        ybkh : ybkh
    };

    //获取剩余字段
    var tpost = resmsg.match(/name="tpost" value="(.*?)" \/>/)
    postdata.tpost = tpost[1];

    var reg = new RegExp("<input type=hidden name=(.*?)  value=(.*?)>","g");
    var  each ;
    while(r = reg.exec(resmsg)) {
        postdata[r[1]] = r[2];
    }

    var path = "/comm/beiyi3/ghdown.php"
    var method = "POST";
    var referurl = "http://www.bjguahao.gov.cn/comm/beiyi3/guahao.php?hpid=142&ksid=1010201&datid=224675";



    //获取短信验证码
    rl.question("输入短信验证码\n ", function(input2) {
        dxcode = input2;
        postdata.dxcode = dxcode;
        console.log("发送信息：" );
        console.log(postdata);
        sendQingqiu(path, referurl, method, postdata);
        rl.close();

    });

}

function sendQingqiu(path, referurl, method, formdata, nexthandlefunc) {



    var headers = {
        "Accept":"*",
        "Host": "www.bjguahao.gov.cn",
        "Content-Type" : "application/x-www-form-urlencoded; charset=UTF-8",
        "Accept-Language":"zh-cn,zh;q=0.8,en-us;q=0.5,en;q=0.3",
        "User-Agent": "Mozilla/5.0 (Windows NT 5.1; rv:33.0) Gecko/20100101 Firefox/33.0",
        "Referer":	referurl,
        "X-Requested-With":	"XMLHttpRequest"
    };
    if (method == "POST") {
        var postdata  = querystring.stringify(formdata);
        headers["Content-Length"] =  postdata.length;
    }
    if (cookie) {
        headers["Cookie"] = cookie;
    }
    var options = {
        hostname : "http://www.bjguahao.gov.cn",
        port : "80",
        method : method,
        path : path,
        headers : headers
    };
    var req = http.request(options, function(res){
        var databuffer = []  ;
        var resHeaders = res.headers;
        var size=0;
        res.on("data", function(data){
            databuffer.push(data);
            size = size + data.length;
        });
        res.on("end", function(){
            var buffer = new Buffer(size), pos = 0;
            for(var i = 0, l = databuffer.length; i < l; i++) {
                databuffer[i].copy(buffer, pos);
                pos += databuffer[i].length;
            }
            var str = Iconv.decode(buffer, 'GBK');
            if (nexthandlefunc) {
                nexthandlefunc(buffer, resHeaders, str);
            } else {
                console.log("aaaa"+str);
            }
        });
    });
    if ( method == "POST" ) {
        req.write(postdata);
    }
    req.end();
}


