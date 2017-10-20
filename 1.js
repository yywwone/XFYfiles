( function( global ){
    var document = global.document;

    function Table( options ){
        extend( this, tableSettings, options );
        this.load( function( jdata ) {
            // 在回调函数 通过call方法改变了 this 的指向，变成了Table对象
            var data = JSON.parse( jdata );
             // 将请求的数据赋值给Table对象tableData属性
            this.tableData = data;
            // 然后调用draw方法绘制表格
            this.draw();
            // 绑定事件
            this.bind();
        } );
    }

    Table.prototype = {
        constructor: Table,
        load: function( callback ){
            var xhr = global.XMLHttpRequest ? 
                new global.XMLHttpRequest() : 
                new global.ActiveXObejct( 'XMLHTTP' );

            var self = this;

            xhr.open( this.type, this.url, this.async );
            xhr.onreadystatechange = function(){
                var readystate = xhr.readyState,
                    status = xhr.status;

                if( readystate == 4 ){
                    if( status >= 200 && status < 300 || status == 304 ){
                        // success 执行回调函数，将服务器返回的数据 传入回调函数中
                        callback.call( self, xhr.responseText );                       
                    } else {
                        // fail
                        console.warn( '请求错误' );
                    }
                }
            };
            xhr.send();            
        },
        drawHead: function(){
            var thead = document.createElement( 'thead' ),
                tr = document.createElement( 'tr' ),
                th;

            var i = 0,
                l = this.model.length;
            // 添加序号列
            th = document.createElement( 'th' );
            th.style.width = '30px';
            th.innerHTML = '序号';
            tr.appendChild( th );

            for( ; i < l; i++ ){
                th = document.createElement( 'th' );
                th.innerHTML = this.model[ i ].title;
                // 给当前th添加自定义属性data-index 存储列的序号
                th.setAttribute( 'data-index', i );
                // 设置列的宽度
               this.model[ i ].width && 
                (th.style.width = global.parseFloat( this.model[ i ].width ) + 'px' );
    
                tr.appendChild( th );
            }
            // 添加操作列
            th = document.createElement( 'th' );
            th.innerHTML = '操作';
            th.style.width = '80px';
            tr.appendChild( th );
            thead.appendChild( tr );

            return thead;
        },
        drawBody: function(){
            var tbody = document.createElement( 'tbody' ),
                tr,
                td;

            var data = this.tableData,
                i = 0,
                l = data.length;

            var k, obj;

            // 遍历数据
            for( ; i < l; i++ ){
                tr = document.createElement( 'tr' );
                // 添加序号列
                td = document.createElement( 'td' );
                td.innerHTML = i + 1;
                tr.appendChild( td );
                td.align = 'center';

                obj = data[ i ];
                this.model.forEach( function( m ) {
                    td = document.createElement( 'td' );
                    // 如果数据里没有该属性，就指定td内容为空字符串
                    td.innerHTML = obj[ m.property ] == undefined ? '' : obj[ m.property ];
                    // 设置当前列对齐方式
                    m.align && 
                    ( td.style.textAlign = m.align );
                    // 设置文本颜色
                    m.color && ( td.style.color = m.color );
                    tr.appendChild( td );
                } );
                // 添加操作单元格
                td = document.createElement( 'td' );
                td.innerHTML = '<a href="javascript:;">编辑</a><a href="javascript:;">删除</a>';
                td.style.textAlign = 'center';
                tr.appendChild( td );
                tbody.appendChild( tr );
            }

            return tbody;
        },
        draw: function(){
            var table = this.table = document.createElement( 'table' );
            table.className = this.tableClass;
            // 如果设置了表格宽度
            this.width && ( table.style.width = global.parseFloat( this.width ) + 'px' );
           /* if( this.width ){ 
                table.style.width = global.parseFloat( this.width ) + 'px';
            }*/
            table.appendChild( this.drawHead() );
            table.appendChild( this.drawBody() );
            document.querySelector( this.target ).appendChild( table );
        },
        bind: function(){
            var self = this;
            // 先调用draw方法,在调用bind方法
            var tr = document.querySelector( this.target + ' table thead tr' );
            tr.addEventListener( 'click', function( e ) {
                var target = e.target;
                var sortKey, // 排序方式： 1 -- 升序； -1 -- 降序
                    sortBy;  // 排序的字段
                // 获取点击列的序号--对应model元素的索引
                var index = target.getAttribute( 'data-index' );
                if( index ){
                    // 获取排序字段
                    sortBy = index ? self.model[ index ].property : null;
                    // 获取排序方式
                    // 用自定义属性data-key存储上一次的排序方式
                    // 如果第一次点击th，没有data-key属性，拿到的值为null，此时应该存储上一次排序方式 即降序
                    sortKey = target.getAttribute( 'data-key' ) || -1;
                    // 设置当次排序方式
                    sortKey = -sortKey;
                    target.setAttribute( 'data-key', sortKey );
                    // 给tableDate数据排序
                    self.tableData.sort( function( a, b ) {
                        return a[ sortBy ] > b[ sortBy ] ? sortKey : -sortKey;
                    } );  
                }                 
                // 刷新表格
                self.refresh();
            } );
        },
        refresh: function(){
            // 重绘表格体
            // 先移除以前的tbody
            this.table.removeChild( this.table.tBodies[ 0 ] );
            // 在添加新的tbody
            this.table.appendChild( this.drawBody() );
        }
    };

    var tableSettings = {
        url: global.location.href,
        type: 'get',
        async: true,
        data: {},
        tableData: null,
        tableClass: 'grid-table'
    };

    function extend( target ){
        if( !target ){
            return undefined;
        }

        var args = arguments,
            i = 1,
            l = args.length;

        var k, obj;

        for( ; i < l; i++ ){
            obj = args[ i ];
            for( k in obj ){
                if( obj.hasOwnProperty( k ) ){
                    target[ k ] = obj[ k ];
                }
            }
        }

        return target;
    }
    
    function table( options ){
        try {
            if( !( options && options.target && options.model ) ){
                throw new Error( '参数异常' );
            }
        } catch( err ){
            console.log( err );
            return null;
        }
        return new Table( options );
    }
    // 将table函数赋值给全局对象的table属性--暴漏工厂函数
    global.table = table;
} )( window );

table( {
    url: 'data.json',
    target: '#list',
    model: [ 
        { 'title': '金币数', 'property': 'count', align: 'right', width: '80', color: 'red' }, {
        'title': '姓名', 'property': 'name', width: '60', align: 'center' }, {
        'title': '性别', 'property': 'gender', align: 'center' }, { 
        'title': '年龄', 'property': 'age', width: '40px', align: 'center' }, {
        'title': '邮箱', 'property': 'email', width: '100px', align: 'center' }, {
        'title': '详细信息', 'property': 'details' } 
    ],
    width: '800' // 表格宽度
} );