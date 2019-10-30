<template>
  <div class="floor-list-wrapper">
    <!-- 图例 -->
    <checkInHeader style="background:#c1c1c1">
      <div class="tool-bar" slot="toolBarLeft" style="min-width:480px;padding-left:5px;z-index:10">
        <strong>{{floorData.name}}</strong>&nbsp;&nbsp;&nbsp;&nbsp;
        房间数：<span class="color-red">{{floorData.roomNum}}</span>间&nbsp;&nbsp;
        床位数：<span class="color-red">{{floorData.bedNum}}</span>张 
        已住：<span class="color-red">{{floorData.peopleNum}}</span>人  
        空床位：<span class="color-red">{{floorData.emptyBedNum}}</span>张
        <i :class="isShowPic ? 'el-icon-picture show-pic color-red' : 'el-icon-picture show-pic'" @click="isShowPic = !isShowPic" title="显示楼层图"></i>
      </div>
    </checkInHeader>
    <!-- 楼层列表 -->
    <div class="floor-list-content">
      <div class="floor-list">
        <!-- 楼层图 -->
        <div class="floor-pic" v-if="isShowPic">
          <img v-if="floorData.plan.length" class="pics" v-for="(imgs,idx) in floorData.plan.split(',')" :key="idx" :src="imgs" alt="">
          <i v-else class="el-icon-picture" style="width:300px;height:200px;color:#ddd;font-size:180px"></i>
        </div>
        <div class="list-main">
          <!-- 房间详情 -->
          <div class="suite-wrap" v-for="(items,idx) in floorData.list" :key="idx">
            <div class="floor-suite" :title="'套间：'+items.suiteName" @click="showSuiteHandle(items.code)" v-if="items.type == 'SUITE'" style="cursor:pointer">{{items.suiteName}}</div>
            <div class="room-wrap">
              <!-- 公寓类型 -->
              <div class="floor-list-item" v-if="items.type == 'SUITE'" v-for="(item,idx) in items.rooms" :key="idx">
                <div class="item-head">
                  <span @click="showRoomHandle(item.code)" style="cursor:pointer">{{item.roomName}}</span>
                  <i class="el-icon-info color-green" v-if="item.labels" style="margin-left:5px;cursor:pointer" :title="switchLabel(item.labels)"></i>
                </div>
                <div v-if="item.type == 'ROOM'" class="item-medium">
                  <div class="item-useLabels" v-if="item.useLabels">{{switchUseLabel(item.useLabels)}}</div>
                  <el-dropdown trigger="click" v-else class="medium-item" v-for="(item2,index2) in item.beds" :key="index2">
                    <span class="el-dropdown-link ellipsis" v-if="item2.studentName" :style="`cursor:pointer;
                  color: ${(item2.studentSex == '女') ? 'red' : 'blue'}`"><b @click="getBedsInfo(item2)">{{item2.bedName.substring(0,1)}}</b>.<span class="name-ellipsis" :title="item2.studentName+' '+item2.studentClass">{{item2.studentName}}</span>
                      <!-- 学生标签 -->
                      <span v-if="item2.studentName.length && item2.studentLabels" :title="item2.studentLabels.join(',')">
                        <icon-svg title="asdasd" name="task" style="float:right;cursor:pointer"></icon-svg>
                      </span>
                    </span>
                    <span class="el-dropdown-link ellipsis" v-else :style="`cursor:pointer;
                  color: ${switchStatus(item2.status)}`"><b @click="getBedsInfo(item2)">{{item2.bedName.substring(0,1)}}</b>.{{item2.status}}
                      <!-- 学生标签 -->
                      <span v-if="item2.studentName.length && item2.studentLabels" :title="item2.studentLabels.join(',')">
                        <icon-svg title="asdasd" name="task" style="float:right;cursor:pointer"></icon-svg>
                      </span>
                    </span>
                    <el-dropdown-menu slot="dropdown">
                      <el-dropdown-item v-if="item2.studentName" @click.native="showHandle(item2.studentNumber)">人员信息卡</el-dropdown-item>
                      <el-dropdown-item v-if="item2.studentName" @click.native="toExchangeHandle(item2.code)">零星换宿</el-dropdown-item>
                      <el-dropdown-item v-if="item2.studentName" @click.native="toSwopHandle(item2.code)">人员对调</el-dropdown-item>
                      <el-dropdown-item v-if="item2.studentName" @click.native="tocheckoutHandle(item2.code)">零星退宿</el-dropdown-item>
                      <el-dropdown-item v-if="item2.status == '未启用'" @click.native="updareBedStatusHandle(item2.code,dataForm.idleing)">启用床位</el-dropdown-item>
                      <el-dropdown-item v-if="item2.status == '计划中'" :command="`showBedInfo#${JSON.stringify(item2)}`">床位安排信息</el-dropdown-item>
                      <el-dropdown-item v-if="item2.status == '闲置中' || item2.status == '入楼中' || item2.status == '离楼中' || item2.status == '毕业中'" @click.native="toStaffAllocationHandle(item2.code)">零星分配</el-dropdown-item>
                      <el-dropdown-item v-if="item2.status == '闲置中' || item2.status == '入楼中' || item2.status == '离楼中' || item2.status == '毕业中'" @click.native="updareBedStatusHandle(item2.code,dataForm.not_enabled)">禁用床位</el-dropdown-item>
                    </el-dropdown-menu>
                    <!-- <el-dropdown-menu v-else slot="dropdown">
                  </el-dropdown-menu> -->
                  </el-dropdown>
                </div>
                <div class="item-footer">
                  <p class="footer-p" :title="item3" v-for="(item3,index3) in item.describes" :key="index3" :class="item3.indexOf('混') > 0 ? 'color-red ellipsis' : 'ellipsis'" v-if="item3">{{item3}}</p>
                </div>
              </div>
              <!-- 普通房间 -->
              <div class="floor-list-item" v-if="items.type == 'ROOM'">
                <div class="item-head">
                  <span @click="showRoomHandle(items.code)" style="cursor:pointer">{{items.roomName}}</span>
                  <i class="el-icon-info color-green" v-if="items.labels" style="margin-left:5px;cursor:pointer" :title="switchLabel(items.labels)"></i>
                </div>
                <div class="item-medium">
                  <div class="item-useLabels" v-if="items.useLabels">{{switchUseLabel(items.useLabels)}}</div>
                  <el-dropdown trigger="click" v-else class="medium-item" v-for="(item2,index2) in items.beds" :key="index2">
                    <span class="el-dropdown-link ellipsis" v-if="item2.studentName" :style="`cursor:pointer;
                  color: ${(item2.studentSex == '女') ? 'red' : 'blue'}`"><b @click="getBedsInfo(item2)">{{item2.bedName.substring(0,1)}}</b>.
                      <span class="name-ellipsis" :title="item2.studentName+' '+item2.studentClass">{{item2.studentName}}</span>
                      <!-- 学生标签 -->
                      <span v-if="item2.studentName.length && item2.studentLabels" :title="item2.studentLabels.join(',')">
                        <icon-svg title="asdasd" name="task" style="float:right;cursor:pointer"></icon-svg>
                      </span>
                    </span>
                    <span class="el-dropdown-link ellipsis" v-else :style="`cursor:pointer;
                  color: ${switchStatus(item2.status)}`"><b @click="getBedsInfo(item2)">{{item2.bedName.substring(0,1)}}</b>.{{item2.status}}
                      <!-- 学生标签 -->
                      <span v-if="item2.studentName.length  && item2.studentLabels" :title="item2.studentLabels.join(',')">
                        <icon-svg name="task" style="float:right;cursor:pointer"></icon-svg>
                      </span>
                    </span>
                    <el-dropdown-menu slot="dropdown">
                      <el-dropdown-item v-if="item2.studentName" @click.native="showHandle(item2.studentNumber)">人员信息卡</el-dropdown-item>
                      <el-dropdown-item v-if="item2.studentName" @click.native="toExchangeHandle(item2.code)">零星换宿</el-dropdown-item>
                      <el-dropdown-item v-if="item2.studentName" @click.native="toSwopHandle(item2.code)">人员对调</el-dropdown-item>
                      <el-dropdown-item v-if="item2.studentName" @click.native="tocheckoutHandle(item2.code)">零星退宿</el-dropdown-item>
                      <el-dropdown-item v-if="item2.status == '未启用'" @click.native="updareBedStatusHandle(item2.code,dataForm.idleing)">启用床位</el-dropdown-item>
                      <el-dropdown-item v-if="item2.status == '计划中'" :command="`showBedInfo#${JSON.stringify(item2)}`">床位安排信息</el-dropdown-item>
                      <el-dropdown-item v-if="item2.status == '闲置中' || item2.status == '入楼中' || item2.status == '离楼中' || item2.status == '毕业中'" @click.native="toStaffAllocationHandle(item2.code)">零星分配</el-dropdown-item>
                      <el-dropdown-item v-if="item2.status == '闲置中' || item2.status == '入楼中' || item2.status == '离楼中' || item2.status == '毕业中'" @click.native="updareBedStatusHandle(item2.code,dataForm.not_enabled)">禁用床位</el-dropdown-item>
                    </el-dropdown-menu>
                  </el-dropdown>
                </div>
                <div class="item-footer">
                  <p class="footer-p" :title="item3" v-for="(item3,index3) in items.describes" :key="index3" :class="item3.indexOf('混') > 0 ? 'color-red ellipsis' : 'ellipsis'" v-if="item3">{{item3}}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- 弹窗, 个人信息卡 -->
    <show :tit="panelTit" v-if="showVisible" ref="show"></show>
    <!-- 弹窗, 零星安排住宿 -->
    <add-or-update :tit="panelTit" v-if="addOrUpdateVisible" ref="addOrUpdate" @refreshDataList="refreshFloorContentList"></add-or-update>
    <!-- 弹窗, 退宿 -->
    <checkout :tit="panelTit" v-if="checkoutVisible" ref="checkout" @refreshDataList="refreshFloorContentList"></checkout>
    <!-- 弹窗, 换宿 -->
    <exchange :tit="panelTit" v-if="exchangeVisible" ref="exchange" @refreshDataList="refreshFloorContentList"></exchange>
    <!-- 弹窗, 对调 -->
    <swop :tit="panelTit" v-if="swopVisible" ref="swop" @refreshDataList="refreshFloorContentList"></swop>
    <!-- 弹窗, 房间信息卡 -->
    <roomShow :tit="panelTit" v-if="roomShowVisible" ref="roomShow"></roomShow>
    <!-- 弹窗, 套间信息卡 -->
    <suiteShow v-if="suiteShowVisible" ref="suiteShow" :tit="panelTit"></suiteShow>
  </div>
</template>

<script>
const remainTypeSource = {
  1: '5秒以上',
  2: '10秒以上',
  3: '15秒以上',
  4: '30秒以上',
  5: '60秒以上',
  6: '180秒以上',
  7: '300秒以上'
}

export default {
  name: 'HotRankList',
  props: {
    listData: {
      type: Array,
      default: () => []
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  methods: {
    getRankClass(rank) {
      let b = 12
      let a = `${b}我怕大象?s作业add爱迪生a${b}`
      return `rank${rank}`
    }
  }
}
</script>

<style scoped>
/deep/ .el-table thead th {
  background-color: #fafafa;
  color: rgba(0, 0, 0, 0.65);
}

/deep/ .rank-column div {
  margin: 0 auto;
}

.rank {
  width: 20px;
  height: 20px;
  border-radius: 10px;
  color: #fff;
  line-height: 20px;
}

.rank1 {
  background: #ff5418;
}

.rank2 {
  background: #ff846a;
}

.rank3 {
  background: #ff9e6a;
}
</style>
