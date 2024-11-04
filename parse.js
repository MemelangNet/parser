

let id2str = [];
let id2tok = [];
let str2id = {};
let cmds={};
let rcmds=[];

// These chracters always START NEW commands
// So =. is actually = then .
let xcmd={
    '.'     :   1,
    '+'     :   1,
    '-'     :   1,
    '/'     :   1,
};

const files = [
    './core.mid',
    './family.mid',
];


reload();

function reload() {

    id2str = [];
    str2id = {};
    id2tok = [];
    cmds={};
    rcmds=[];

    document.getElementsByTagName('pre')[0].innerHTML="<b>// MEMES</b>\n";

    // Create an array of promises using fetch
    const fetchPromises = files.map(file => fetch(file).then(response => response.text()));

    // Wait until all fetch requests are done using Promise.all
    Promise.all(fetchPromises)
        .then(contents => {
            
            // Concatenate all the content from the files
            let allContent = contents.join("\n");
            allContent=normalize(allContent);

            idize(allContent);
            //console.log(id2str);
            tokrun();

            document.getElementsByTagName('pre')[0].innerHTML+=strrun();

        })
        .catch(error => {
            console.error('Error loading files:', error);
        });
}

// expand shorthand statements
function normalize (content) {
    return content
        .replace(/([a-zA-Z]+) ([a-zA-Z]+) ([a-zA-Z]+) ([0-9\.]+)/g, '$1.$2:$3=$4')
        .replace(/([a-zA-Z]+) is ([a-zA-Z]+)/g, '$1.$2:$1=1')
        .replace(/([a-zA-Z]+) ([a-zA-Z]+) ([a-zA-Z]+)/g, '$1.$2:$3=1')
        .replace(/\/\/[^\n]*/g, '');
}


// store id-string pairs
function idize (content) {
    let lines = content.split(/\n/);
    let count = lines.length;
    let words=[];
    let id=0;
    let str='';
    
    for (let i = 0; i < count; i++) {
        words=lines[i].replace(/^\s+/, '').replace(/\s+$/, '').split(/\s+/);
        
        if (words[0].length<1) continue;

        id=parseInt(words.shift());
        str=words.join(' ');

        if (id2str[id]) throw new Error("Redundant ID "+id+" on line "+i);

        id2str[id]=str
        str2id[str]=id;

        if (id>1 && id<100) {
            cmds[str]=id;
            rcmds[id]=str;
        }
    }
}


// convert statements from strings to IDs
function tokrun () {
    let count = id2str.length;
    let tokens=[];
    for (let i = 0; i < count; i++) {
        if (/[^a-zA-Z0-9\.]/.test(id2str[i])) {
            tokens=tokenize(id2str[i]);
            if (tokens.length>1) {
                id2tok[i]=tokens;
                console.log(id2str[i], tokens);
            }
        }
    }
}


function strrun () {
    var outstr='';
    let count = id2tok.length;
    for (let i = 0; i < count; i++) {
        if (id2tok[i]) outstr+=stringify(id2tok[i])+";\n";
    }
    return outstr;
}


// convert a statement into IDs
function tokenize (content) {
    let tokens = [];
    let chars = content.split('');
    let count = chars.length;
    let val=null;
    let j=0;
    
    bigloop: for (let i = 0; i < count; i++) {
        val='';

        // empty chars
        if (/\s/.test(chars[i])) continue;

        // comment
        else if (chars[i] === '/' && chars[i + 1] === '/') {
            for (i = i + 1; i < count; i++) {
                if (chars[i] === "\n") break;
            }
        }

        // command
        else if (cmds[chars[i]]) {
            for (j=0; j < 4; j++) {
                if (cmds[chars[i+j]] && (j===0 || !xcmd[chars[i+j]])) {
                    //console.log(chars[i+j], cmds[chars[i+j]]);
                    val+=chars[i+j];
                }
                else {
                    i+=j-1;
                    if (isNaN(parseInt(cmds[val]))) throw new Error("CMD not recognized in "+content);
                    tokens.push(parseInt(cmds[val]));
                    continue bigloop;
                }
            }
        }

        // string value
        else if (/[a-zA-Z]/.test(chars[i])) {
            for (i=i; i<count; i++) {
                if (/[a-zA-Z]/.test(chars[i])) val+=chars[i];
                else break;
            }

            // last expression in content
            if (!str2id[val]) throw new Error("No ID for "+val+" in "+content);
            tokens.push(str2id[val]);
            if (i===count-1) break;
            i--;
            continue;
           
        }
        
        // float value
        else if (/[0-9]/.test(chars[i])) {
            for (i=i; i < count; i++) {
                if (/[0-9\.]/.test(chars[i])) val+=chars[i];
                else break;
            }
            
            if (val==0) val=0;
            else if (val==1) val=1;
            else val=parseFloat(val);

            if (isNaN(val)) throw new Error("Float error "+val);
            tokens.push(val);
            if (i===count-1) break;
            i--;
            continue;
        }
    }
    return tokens;
}


function stringify (tokens) {
    let outstr='';
    let pc = 0;
    let count = tokens.length;
    for (let i=0; i<count; i++) {
        if (typeof tokens[i] === 'string')  outstr+=tokens[i];
        else if (tokens[i]>1 && tokens[i]<100) {
            if (id2str[tokens[i]].indexOf('=')>-1) outstr+=' '+id2str[tokens[i]]+' ';
            else outstr+=id2str[tokens[i]];
        }

        else {
            pc = tokens[i-1];
            if (i==0) outstr+='<i class="a v${pc}">';
            else if (pc===2) outstr+='<i class="r v${pc}">';
            else if (pc===3) outstr+='<i class="r ri v${pc}">';
            else if (pc===4) outstr+='<i class="b v${pc}">';
            else if (pc===5) outstr+='<i class="q v${pc}">';
            else outstr+='<i>';
            
            outstr+=id2str[tokens[i]];

            outstr+='</i>';
        }
    }
    return outstr;
}