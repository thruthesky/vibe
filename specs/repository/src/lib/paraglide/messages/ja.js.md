---
title: ja.js
type: javascript
path: src/lib/paraglide/messages/ja.js
status: active
version: 1.0.0
last_updated: 2025-11-15
---

## 개요

이 파일은 `src/lib/paraglide/messages/ja.js`의 소스 코드를 포함하는 SED 스펙 문서입니다.

## 소스 코드

```javascript
/* eslint-disable */


export const helloworld1 = /** @type {(inputs: { name: NonNullable<unknown> }) => string} */ (i) => {
	return `Hello, ${i.name} from ja!`
};

export const commonloading1 = /** @type {(inputs: {}) => string} */ () => {
	return `読み込み中...`
};

export const commonclose1 = /** @type {(inputs: {}) => string} */ () => {
	return `閉じる`
};

export const commonsave1 = /** @type {(inputs: {}) => string} */ () => {
	return `保存`
};

export const commondelete1 = /** @type {(inputs: {}) => string} */ () => {
	return `削除`
};

export const commoncancel1 = /** @type {(inputs: {}) => string} */ () => {
	return `キャンセル`
};

export const commonconfirm1 = /** @type {(inputs: {}) => string} */ () => {
	return `確認`
};

export const commonrefresh1 = /** @type {(inputs: {}) => string} */ () => {
	return `更新`
};

export const commonretry1 = /** @type {(inputs: {}) => string} */ () => {
	return `再試行`
};

export const commoninfo1 = /** @type {(inputs: {}) => string} */ () => {
	return `情報`
};

export const commonstatus1 = /** @type {(inputs: {}) => string} */ () => {
	return `状態`
};

export const commonsuccess1 = /** @type {(inputs: {}) => string} */ () => {
	return `成功`
};

export const commonerror1 = /** @type {(inputs: {}) => string} */ () => {
	return `エラー`
};

export const commoncomplete1 = /** @type {(inputs: {}) => string} */ () => {
	return `完了`
};

export const commonprogress1 = /** @type {(inputs: {}) => string} */ () => {
	return `進行状況`
};

export const commongo1 = /** @type {(inputs: {}) => string} */ () => {
	return `移動`
};

export const commonuser1 = /** @type {(inputs: {}) => string} */ () => {
	return `ユーザー`
};

export const navhome1 = /** @type {(inputs: {}) => string} */ () => {
	return `ホーム`
};

export const navabout1 = /** @type {(inputs: {}) => string} */ () => {
	return `紹介`
};

export const navproducts1 = /** @type {(inputs: {}) => string} */ () => {
	return `製品`
};

export const navcontact1 = /** @type {(inputs: {}) => string} */ () => {
	return `お問い合わせ`
};

export const navboard1 = /** @type {(inputs: {}) => string} */ () => {
	return `掲示板`
};

export const navchat1 = /** @type {(inputs: {}) => string} */ () => {
	return `チャット`
};

export const navfindusers2 = /** @type {(inputs: {}) => string} */ () => {
	return `ユーザー検索`
};

export const navlogin1 = /** @type {(inputs: {}) => string} */ () => {
	return `ログイン`
};

export const navlogout1 = /** @type {(inputs: {}) => string} */ () => {
	return `ログアウト`
};

export const navmenu1 = /** @type {(inputs: {}) => string} */ () => {
	return `メニュー`
};

export const navmyprofile2 = /** @type {(inputs: {}) => string} */ () => {
	return `マイプロフィール`
};

export const authwelcome1 = /** @type {(inputs: {}) => string} */ () => {
	return `ようこそ`
};

export const authwelcomemessage2 = /** @type {(inputs: {}) => string} */ () => {
	return `Sonubへようこそ`
};

export const authintro1 = /** @type {(inputs: {}) => string} */ () => {
	return `SedAi.DevにSonub specでコミュニティ機能を追加します。`
};

export const authgetstarted2 = /** @type {(inputs: {}) => string} */ () => {
	return `始める`
};

export const authsigninguide3 = /** @type {(inputs: {}) => string} */ () => {
	return `GoogleまたはAppleアカウントでログイン`
};

export const authsigninguidestart4 = /** @type {(inputs: {}) => string} */ () => {
	return `GoogleまたはAppleアカウントでログインして開始`
};

export const authsigninaction3 = /** @type {(inputs: {}) => string} */ () => {
	return `ログイン`
};

export const authsigninwithgoogle4 = /** @type {(inputs: {}) => string} */ () => {
	return `Googleでログイン`
};

export const authsigninwithapple4 = /** @type {(inputs: {}) => string} */ () => {
	return `Appleでログイン`
};

export const authsigningin2 = /** @type {(inputs: {}) => string} */ () => {
	return `ログイン中...`
};

export const authsigningout2 = /** @type {(inputs: {}) => string} */ () => {
	return `ログアウト中...`
};

export const authsigninfailed3 = /** @type {(inputs: {}) => string} */ () => {
	return `ログイン失敗`
};

export const authsigninrequired3 = /** @type {(inputs: {}) => string} */ () => {
	return `ログインが必要です`
};

export const authsigninrequireddesc4 = /** @type {(inputs: {}) => string} */ () => {
	return `アカウントにログインしてより多くの機能を利用`
};

export const authwelcomeuser2 = /** @type {(inputs: { name: NonNullable<unknown> }) => string} */ (i) => {
	return `${i.name}さん、ログインしました。`
};

export const profilenickname1 = /** @type {(inputs: {}) => string} */ () => {
	return `ニックネーム`
};

export const profilenicknameinput2 = /** @type {(inputs: {}) => string} */ () => {
	return `ニックネームを入力`
};

export const profilenicknamerequired2 = /** @type {(inputs: {}) => string} */ () => {
	return `ニックネームを入力してください。`
};

export const profilenicknamelength2 = /** @type {(inputs: {}) => string} */ () => {
	return `ニックネームは50文字以内にしてください。`
};

export const profilenicknamemaxlength3 = /** @type {(inputs: {}) => string} */ () => {
	return `最大50文字`
};

export const profilegender1 = /** @type {(inputs: {}) => string} */ () => {
	return `性別`
};

export const profilegendermale2 = /** @type {(inputs: {}) => string} */ () => {
	return `男性`
};

export const profilegenderfemale2 = /** @type {(inputs: {}) => string} */ () => {
	return `女性`
};

export const profilegendernoanswer3 = /** @type {(inputs: {}) => string} */ () => {
	return `選択しない`
};

export const profiledateofbirth3 = /** @type {(inputs: {}) => string} */ () => {
	return `生年月日`
};

export const profileyear1 = /** @type {(inputs: {}) => string} */ () => {
	return `年`
};

export const profilemonth1 = /** @type {(inputs: {}) => string} */ () => {
	return `月`
};

export const profileday1 = /** @type {(inputs: {}) => string} */ () => {
	return `日`
};

export const profileyearvalue2 = /** @type {(inputs: { year: NonNullable<unknown> }) => string} */ (i) => {
	return `${i.year}年`
};

export const profilemonthvalue2 = /** @type {(inputs: { month: NonNullable<unknown> }) => string} */ (i) => {
	return `${i.month}月`
};

export const profiledayvalue2 = /** @type {(inputs: { day: NonNullable<unknown> }) => string} */ (i) => {
	return `${i.day}日`
};

export const profiledateofbirthpasterror5 = /** @type {(inputs: {}) => string} */ () => {
	return `生年月日は過去の日付である必要があります。`
};

export const profileagerestriction2 = /** @type {(inputs: { minYear: NonNullable<unknown>, maxYear: NonNullable<unknown> }) => string} */ (i) => {
	return `18歳以上である必要があります (${i.minYear}年 - ${i.maxYear}年)`
};

export const profilepicture1 = /** @type {(inputs: {}) => string} */ () => {
	return `プロフィール写真`
};

export const profilepictureuploadguide3 = /** @type {(inputs: {}) => string} */ () => {
	return `クリックしてプロフィール写真をアップロード（最大5MB）`
};

export const profilepictureuploadsuccess3 = /** @type {(inputs: {}) => string} */ () => {
	return `プロフィール写真がアップロードされました。`
};

export const profilepictureuploadfailed3 = /** @type {(inputs: {}) => string} */ () => {
	return `写真のアップロードに失敗しました。もう一度お試しください。`
};

export const profilepictureremove2 = /** @type {(inputs: {}) => string} */ () => {
	return `写真を削除`
};

export const profilepictureremovesuccess3 = /** @type {(inputs: {}) => string} */ () => {
	return `プロフィール写真が削除されました。`
};

export const profilepictureremovefailed3 = /** @type {(inputs: {}) => string} */ () => {
	return `写真の削除に失敗しました。もう一度お試しください。`
};

export const profilepicturetypeerror3 = /** @type {(inputs: {}) => string} */ () => {
	return `画像ファイルのみアップロードできます。`
};

export const profilepicturesizeerror3 = /** @type {(inputs: {}) => string} */ () => {
	return `ファイルサイズは5MB以下である必要があります。`
};

export const profilesave1 = /** @type {(inputs: {}) => string} */ () => {
	return `プロフィール保存`
};

export const profilesaving1 = /** @type {(inputs: {}) => string} */ () => {
	return `保存中...`
};

export const profilesavesuccess2 = /** @type {(inputs: {}) => string} */ () => {
	return `プロフィールが正常に更新されました。`
};

export const profilesavefailed2 = /** @type {(inputs: {}) => string} */ () => {
	return `プロフィールの保存に失敗しました。もう一度お試しください。`
};

export const profileloading1 = /** @type {(inputs: {}) => string} */ () => {
	return `プロフィール情報を読み込み中...`
};

export const profileloadfailed2 = /** @type {(inputs: {}) => string} */ () => {
	return `プロフィール情報の読み込みに失敗しました。`
};

export const profileinfo1 = /** @type {(inputs: {}) => string} */ () => {
	return `会員情報`
};

export const profileinfoguide2 = /** @type {(inputs: {}) => string} */ () => {
	return `ニックネーム、性別、生年月日を設定`
};

export const profileinfoeditguide3 = /** @type {(inputs: {}) => string} */ () => {
	return `会員情報を修正できます`
};

export const userlist1 = /** @type {(inputs: {}) => string} */ () => {
	return `ユーザーリスト`
};

export const userlistguide2 = /** @type {(inputs: {}) => string} */ () => {
	return `Firebase Realtime Databaseに登録されたすべてのユーザーを確認`
};

export const userjoindate2 = /** @type {(inputs: {}) => string} */ () => {
	return `登録日:`
};

export const userlastlogin2 = /** @type {(inputs: {}) => string} */ () => {
	return `最終ログイン:`
};

export const usernoname2 = /** @type {(inputs: {}) => string} */ () => {
	return `名前なし`
};

export const userloading1 = /** @type {(inputs: {}) => string} */ () => {
	return `ユーザーリストを読み込み中...`
};

export const usernotregistered2 = /** @type {(inputs: {}) => string} */ () => {
	return `登録されたユーザーがいません`
};

export const usernotjoined2 = /** @type {(inputs: {}) => string} */ () => {
	return `まだ登録したユーザーがいません。`
};

export const userloadfailed2 = /** @type {(inputs: {}) => string} */ () => {
	return `ユーザーリストを読み込めません`
};

export const userloadingmore2 = /** @type {(inputs: {}) => string} */ () => {
	return `さらにユーザーを読み込み中...`
};

export const userallloaded2 = /** @type {(inputs: {}) => string} */ () => {
	return `すべてのユーザーを読み込みました`
};

export const userunknownerror2 = /** @type {(inputs: {}) => string} */ () => {
	return `不明なエラーが発生しました。`
};

export const userprofiledetail2 = /** @type {(inputs: {}) => string} */ () => {
	return `ユーザープロフィール詳細`
};

export const menutitle1 = /** @type {(inputs: {}) => string} */ () => {
	return `メニュー`
};

export const menuguide1 = /** @type {(inputs: {}) => string} */ () => {
	return `アカウントと設定管理`
};

export const menumyaccount2 = /** @type {(inputs: {}) => string} */ () => {
	return `マイアカウント`
};

export const menueditprofile2 = /** @type {(inputs: {}) => string} */ () => {
	return `会員情報修正`
};

export const menuadminpage2 = /** @type {(inputs: {}) => string} */ () => {
	return `管理者ページ`
};

export const menudevtest2 = /** @type {(inputs: {}) => string} */ () => {
	return `開発テスト (DatabaseListView)`
};

export const admindashboard1 = /** @type {(inputs: {}) => string} */ () => {
	return `管理者ダッシュボード`
};

export const admindashboardguide2 = /** @type {(inputs: {}) => string} */ () => {
	return `管理ツールを選択して作業を開始してください。`
};

export const admintestusermanagement3 = /** @type {(inputs: {}) => string} */ () => {
	return `テストユーザー管理`
};

export const admintestusermanagementdesc4 = /** @type {(inputs: {}) => string} */ () => {
	return `一時ユーザーの作成/リスト/削除を1ページで管理`
};

export const adminuserlist2 = /** @type {(inputs: {}) => string} */ () => {
	return `ユーザーリスト`
};

export const adminuserlistdesc3 = /** @type {(inputs: {}) => string} */ () => {
	return `作成されたテストユーザーリストを確認`
};

export const adminreportlist2 = /** @type {(inputs: {}) => string} */ () => {
	return `管理者通報リスト`
};

export const adminreportlistdesc3 = /** @type {(inputs: {}) => string} */ () => {
	return `ユーザー通報履歴を確認して管理`
};

export const admintest1 = /** @type {(inputs: {}) => string} */ () => {
	return `テスト`
};

export const admintestdesc2 = /** @type {(inputs: {}) => string} */ () => {
	return `その他のテスト機能を使用`
};

export const admininfopermissionnotimplemented4 = /** @type {(inputs: {}) => string} */ () => {
	return `• 現在、管理者権限検証は実装されていません。`
};

export const admininfotestflag3 = /** @type {(inputs: {}) => string} */ () => {
	return `• テストユーザーは\`isTemporary: true\`フラグで表示されます。`
};

export const admininfodatadelete3 = /** @type {(inputs: {}) => string} */ () => {
	return `• テストデータはいつでも削除できます。`
};

export const admindashboardmenu2 = /** @type {(inputs: {}) => string} */ () => {
	return `ダッシュボード`
};

export const adminuserlistmenu3 = /** @type {(inputs: {}) => string} */ () => {
	return `ユーザーリスト`
};

export const testuserlist2 = /** @type {(inputs: {}) => string} */ () => {
	return `ユーザーリスト`
};

export const testuserguide2 = /** @type {(inputs: {}) => string} */ () => {
	return `テスト用一時ユーザーリストを照会して管理します。`
};

export const testusercount2 = /** @type {(inputs: {}) => string} */ () => {
	return `テストユーザー数`
};

export const testusercreated2 = /** @type {(inputs: { count: NonNullable<unknown> }) => string} */ (i) => {
	return `${i.count}人作成済み`
};

export const testusernotcreated3 = /** @type {(inputs: {}) => string} */ () => {
	return `まだ作成されたユーザーなし`
};

export const testusercreate2 = /** @type {(inputs: {}) => string} */ () => {
	return `テストユーザー作成`
};

export const testusercreateicon3 = /** @type {(inputs: {}) => string} */ () => {
	return `🚀 テストユーザー作成`
};

export const testusercreateguide3 = /** @type {(inputs: {}) => string} */ () => {
	return `ボタンをクリックするとテスト用一時ユーザー100人が順次作成され、リストに追加されます。`
};

export const testusercreating2 = /** @type {(inputs: {}) => string} */ () => {
	return `⏳ 作成中...`
};

export const testusercreatecomplete3 = /** @type {(inputs: {}) => string} */ () => {
	return `✓ 作成完了`
};

export const testusercreatecompletemessage4 = /** @type {(inputs: { count: NonNullable<unknown> }) => string} */ (i) => {
	return `✓ 完了: ${i.count}人のテストユーザーが作成されました。`
};

export const testusercreateatonce4 = /** @type {(inputs: {}) => string} */ () => {
	return `一度に作成される数`
};

export const testusercurrentcreated3 = /** @type {(inputs: {}) => string} */ () => {
	return `現在作成された数`
};

export const testuserdeletinginprogress4 = /** @type {(inputs: {}) => string} */ () => {
	return `削除進行中`
};

export const testuserdeleting2 = /** @type {(inputs: {}) => string} */ () => {
	return `削除中...`
};

export const testuserdeleteall3 = /** @type {(inputs: {}) => string} */ () => {
	return `すべてのテストユーザーを削除`
};

export const testusernotcreatedguide4 = /** @type {(inputs: {}) => string} */ () => {
	return `テストユーザーはまだありません。<strong><a class="text-blue-600" href="/admin/test/create-test-data">テストデータ作成</a></strong>ページで100人のテストユーザーを作成してください。`
};

export const testusergender2 = /** @type {(inputs: {}) => string} */ () => {
	return `性別`
};

export const testuserbirthyear3 = /** @type {(inputs: {}) => string} */ () => {
	return `生年`
};

export const testusercreateddate3 = /** @type {(inputs: {}) => string} */ () => {
	return `作成日`
};

export const testuserstatus2 = /** @type {(inputs: {}) => string} */ () => {
	return `テストユーザー`
};

export const testuserinfodisplay3 = /** @type {(inputs: {}) => string} */ () => {
	return `• このページには\`isTemporary: true\`で表示されたユーザーのみ表示されます。`
};

export const testuserinfodelete3 = /** @type {(inputs: {}) => string} */ () => {
	return `• 各ユーザーは個別または一括で削除できます。`
};

export const testuserinfonorecover4 = /** @type {(inputs: {}) => string} */ () => {
	return `• 削除されたユーザーは復元できません。`
};

export const testuseryeardisplay3 = /** @type {(inputs: { year: NonNullable<unknown> }) => string} */ (i) => {
	return `${i.year}年`
};

export const constructiontitle1 = /** @type {(inputs: {}) => string} */ () => {
	return `工事中`
};

export const constructionmessage1 = /** @type {(inputs: {}) => string} */ () => {
	return `このページは現在開発中です。`
};

export const constructionbacktohome3 = /** @type {(inputs: {}) => string} */ () => {
	return `ホームに戻る`
};

export const boardconstruction1 = /** @type {(inputs: {}) => string} */ () => {
	return `掲示板機能は現在開発中です。`
};

export const chatconstruction1 = /** @type {(inputs: {}) => string} */ () => {
	return `チャット機能は現在開発中です。`
};

export const sidebarmenu1 = /** @type {(inputs: {}) => string} */ () => {
	return `メニュー`
};

export const sidebarrecentactivity2 = /** @type {(inputs: {}) => string} */ () => {
	return `最近のアクティビティ`
};

export const sidebarnorecentactivity3 = /** @type {(inputs: {}) => string} */ () => {
	return `最近のアクティビティはありません。`
};

export const sidebarselectlanguage2 = /** @type {(inputs: {}) => string} */ () => {
	return `言語選択`
};

export const sidebarbuildversion2 = /** @type {(inputs: {}) => string} */ () => {
	return `ビルドバージョン`
};

export const sidebarmyprofile2 = /** @type {(inputs: {}) => string} */ () => {
	return `マイプロフィール`
};

export const sidebarnotifications1 = /** @type {(inputs: {}) => string} */ () => {
	return `通知`
};

export const sidebarnonotifications2 = /** @type {(inputs: {}) => string} */ () => {
	return `新しい通知はありません。`
};

export const sidebarsuggestions1 = /** @type {(inputs: {}) => string} */ () => {
	return `おすすめ`
};

export const sidebarpopularposts2 = /** @type {(inputs: {}) => string} */ () => {
	return `人気投稿`
};

export const sidebarnewfeatures2 = /** @type {(inputs: {}) => string} */ () => {
	return `新機能`
};

export const featuresveltekit51 = /** @type {(inputs: {}) => string} */ () => {
	return `SvelteKit 5`
};

export const featuresveltekit5desc2 = /** @type {(inputs: {}) => string} */ () => {
	return `最新のSvelte 5 runesを使用したモダンフレームワーク`
};

export const featurefirebaseauth2 = /** @type {(inputs: {}) => string} */ () => {
	return `Firebase Auth`
};

export const featurefirebaseauthdesc3 = /** @type {(inputs: {}) => string} */ () => {
	return `GoogleとAppleソーシャルログインサポート`
};

export const featuretailwindcss2 = /** @type {(inputs: {}) => string} */ () => {
	return `TailwindCSS`
};

export const featuretailwindcssdesc3 = /** @type {(inputs: {}) => string} */ () => {
	return `shadcn-svelteと一緒に美しいUI`
};

export const linksveltekitdocs3 = /** @type {(inputs: {}) => string} */ () => {
	return `SvelteKitドキュメント`
};

export const linkfirebasedocs2 = /** @type {(inputs: {}) => string} */ () => {
	return `Firebaseドキュメント`
};

export const linkshadcnsvelte2 = /** @type {(inputs: {}) => string} */ () => {
	return `shadcn-svelte`
};

export const pagetitlehome2 = /** @type {(inputs: {}) => string} */ () => {
	return `Sonub - Welcome`
};

export const pagetitlemenu2 = /** @type {(inputs: {}) => string} */ () => {
	return `メニュー - Sonub`
};

export const pagetitlelogin2 = /** @type {(inputs: {}) => string} */ () => {
	return `ログイン - Sonub`
};

export const pagetitleuserlist3 = /** @type {(inputs: {}) => string} */ () => {
	return `ユーザーリスト - Sonub`
};

export const pagetitlemyprofile3 = /** @type {(inputs: {}) => string} */ () => {
	return `マイプロフィール - Sonub`
};

export const pagetitleboard2 = /** @type {(inputs: {}) => string} */ () => {
	return `掲示板 - Sonub`
};

export const pagetitlechat2 = /** @type {(inputs: {}) => string} */ () => {
	return `チャット - Sonub`
};

export const pagemetalogin2 = /** @type {(inputs: {}) => string} */ () => {
	return `Sonubにログイン`
};

export const admintestmenu2 = /** @type {(inputs: {}) => string} */ () => {
	return `テスト`
};

export const profilepicturepreview2 = /** @type {(inputs: {}) => string} */ () => {
	return `アップロードプレビュー`
};

export const testuserdeleteconfirm3 = /** @type {(inputs: {}) => string} */ () => {
	return `このテストユーザーを削除しますか？`
};

export const testusernousertodelete5 = /** @type {(inputs: {}) => string} */ () => {
	return `削除するテストユーザーがいません。`
};

export const testuserdeleteallconfirm4 = /** @type {(inputs: { count: NonNullable<unknown> }) => string} */ (i) => {
	return `${i.count}人のすべてのテストユーザーを削除しますか？`
};

export const testuserdeleteerror3 = /** @type {(inputs: {}) => string} */ () => {
	return `テストユーザー削除中にエラーが発生しました。`
};

export const testuserlistloaderror4 = /** @type {(inputs: {}) => string} */ () => {
	return `テストユーザーリスト読み込み中のエラー：`
};

export const testusercreateerror3 = /** @type {(inputs: {}) => string} */ () => {
	return `テストユーザー作成中のエラー：`
};

export const testuserdeleteallerror4 = /** @type {(inputs: {}) => string} */ () => {
	return `すべてのテストユーザー削除中のエラー：`
};

export const testuserprogressdisplay3 = /** @type {(inputs: { current: NonNullable<unknown>, total: NonNullable<unknown>, percentage: NonNullable<unknown> }) => string} */ (i) => {
	return `${i.current} / ${i.total} (${i.percentage}%)`
};

export const testusergendermale3 = /** @type {(inputs: {}) => string} */ () => {
	return `男性`
};

export const testusergenderfemale3 = /** @type {(inputs: {}) => string} */ () => {
	return `女性`
};

export const testusergenderother3 = /** @type {(inputs: {}) => string} */ () => {
	return `その他`
};

export const testusercreatecount3 = /** @type {(inputs: {}) => string} */ () => {
	return `100`
};

export const reportreasonabuse2 = /** @type {(inputs: {}) => string} */ () => {
	return `誹謗中傷`
};

export const reportreasonfakenews3 = /** @type {(inputs: {}) => string} */ () => {
	return `虚偽情報`
};

export const reportreasonspam2 = /** @type {(inputs: {}) => string} */ () => {
	return `スパム`
};

export const reportreasoninappropriate2 = /** @type {(inputs: {}) => string} */ () => {
	return `不適切なコンテンツ`
};

export const reportreasonother2 = /** @type {(inputs: {}) => string} */ () => {
	return `その他`
};

export const commonpost1 = /** @type {(inputs: {}) => string} */ () => {
	return `投稿`
};

export const commoncomment1 = /** @type {(inputs: {}) => string} */ () => {
	return `コメント`
};

export const reportcancelconfirm2 = /** @type {(inputs: {}) => string} */ () => {
	return `この通報をキャンセルしますか？`
};

export const authloginrequired2 = /** @type {(inputs: {}) => string} */ () => {
	return `ログインが必要です`
};

export const reportmylist2 = /** @type {(inputs: {}) => string} */ () => {
	return `マイ通報リスト`
};

export const reportmylistguide3 = /** @type {(inputs: {}) => string} */ () => {
	return `あなたが送信した通報を確認できます`
};

export const pagetitlemyreports3 = /** @type {(inputs: {}) => string} */ () => {
	return `マイ通報リスト - Sonub`
};

export const adminreportlistguide3 = /** @type {(inputs: {}) => string} */ () => {
	return `すべてのユーザーの通報を確認できます`
};

export const pagetitleadminreports3 = /** @type {(inputs: {}) => string} */ () => {
	return `管理者通報リスト - Sonub`
};

export const chatchatroom2 = /** @type {(inputs: {}) => string} */ () => {
	return `チャットルーム`
};

export const chatroom1 = /** @type {(inputs: {}) => string} */ () => {
	return `ルーム:`
};

export const chatoverview1 = /** @type {(inputs: {}) => string} */ () => {
	return `チャット概要`
};

export const chatsigninrequired3 = /** @type {(inputs: {}) => string} */ () => {
	return `チャットを開始するにはログインしてください。`
};

export const chatprovideuid2 = /** @type {(inputs: {}) => string} */ () => {
	return `ダイレクトチャットを開くにはuidクエリパラメータを指定してください。`
};

export const chatloadingprofile2 = /** @type {(inputs: {}) => string} */ () => {
	return `参加者プロフィールを読み込み中...`
};

export const chatloadprofilefailed3 = /** @type {(inputs: {}) => string} */ () => {
	return `参加者プロフィールの読み込みに失敗しました。`
};

export const chatchattingwith2 = /** @type {(inputs: { name: NonNullable<unknown> }) => string} */ (i) => {
	return `${i.name}さんとチャット中です。`
};

export const chatroomready2 = /** @type {(inputs: { roomId: NonNullable<unknown> }) => string} */ (i) => {
	return `ルームID ${i.roomId}が準備完了。`
};

export const chatselectconversation2 = /** @type {(inputs: {}) => string} */ () => {
	return `会話を選択して開始してください。`
};

export const chatroomnotready3 = /** @type {(inputs: {}) => string} */ () => {
	return `チャットルームが準備されていません。`
};

export const chatadduidorroomid5 = /** @type {(inputs: {}) => string} */ () => {
	return `会話を開くにはURLに?uid=TARGET_UIDまたは?roomId=ROOM_KEYを追加してください。`
};

export const chatloadingmessages2 = /** @type {(inputs: {}) => string} */ () => {
	return `メッセージを読み込み中...`
};

export const chatnomessages2 = /** @type {(inputs: {}) => string} */ () => {
	return `まだメッセージがありません。挨拶してみましょう！`
};

export const chatloadmessagesfailed3 = /** @type {(inputs: {}) => string} */ () => {
	return `メッセージの読み込みに失敗しました。`
};

export const chatunknownerror2 = /** @type {(inputs: {}) => string} */ () => {
	return `不明なエラー。`
};

export const chatloadingmore2 = /** @type {(inputs: {}) => string} */ () => {
	return `さらに読み込み中...`
};

export const chatuptodate3 = /** @type {(inputs: {}) => string} */ () => {
	return `すべて確認済みです。`
};

export const chatpreparingstream2 = /** @type {(inputs: {}) => string} */ () => {
	return `メッセージストリームを準備中...`
};

export const chatwritemessage2 = /** @type {(inputs: {}) => string} */ () => {
	return `メッセージを入力...`
};

export const chatsending1 = /** @type {(inputs: {}) => string} */ () => {
	return `送信中...`
};

export const chatsend1 = /** @type {(inputs: {}) => string} */ () => {
	return `送信`
};

export const chatsignintosend4 = /** @type {(inputs: {}) => string} */ () => {
	return `メッセージを送信するにはログインしてください。`
};

export const chatsendfailed2 = /** @type {(inputs: {}) => string} */ () => {
	return `メッセージの送信に失敗しました。`
};

export const chatunknownuser2 = /** @type {(inputs: {}) => string} */ () => {
	return `不明なユーザー`
};

export const chatyou1 = /** @type {(inputs: {}) => string} */ () => {
	return `あなた`
};

export const chatpartner1 = /** @type {(inputs: {}) => string} */ () => {
	return `チャットパートナー`
};

export const chatsinglechat2 = /** @type {(inputs: {}) => string} */ () => {
	return `1:1チャット`
};

export const chatmyroomstitle3 = /** @type {(inputs: {}) => string} */ () => {
	return `マイ会話`
};

export const chatmyroomsdesc3 = /** @type {(inputs: {}) => string} */ () => {
	return `参加したチャットルームが時系列で表示されます。`
};

export const chatemptyrooms2 = /** @type {(inputs: {}) => string} */ () => {
	return `まだチャットルームに参加していません。`
};

export const chatloadingrooms2 = /** @type {(inputs: {}) => string} */ () => {
	return `チャットルームを読み込んでいます...`
};

export const chatopenroom2 = /** @type {(inputs: {}) => string} */ () => {
	return `会話を開く`
};

export const chatlastmessagelabel3 = /** @type {(inputs: {}) => string} */ () => {
	return `最後のメッセージ`
};

export const chattabfriends2 = /** @type {(inputs: {}) => string} */ () => {
	return `友達`
};

export const chattabgroupchats3 = /** @type {(inputs: {}) => string} */ () => {
	return `グループチャット`
};

export const chattabopenchats3 = /** @type {(inputs: {}) => string} */ () => {
	return `オープンチャット`
};

export const chattabbookmarks2 = /** @type {(inputs: {}) => string} */ () => {
	return `お気に入り`
};

export const chattabsearch2 = /** @type {(inputs: {}) => string} */ () => {
	return `検索`
};

export const chatcreateroom2 = /** @type {(inputs: {}) => string} */ () => {
	return `ルーム作成`
};

export const chatfindfriends2 = /** @type {(inputs: {}) => string} */ () => {
	return `友達を探す`
};

export const chatcreategroupchat3 = /** @type {(inputs: {}) => string} */ () => {
	return `グループチャット作成`
};

export const chatcreateopenchat3 = /** @type {(inputs: {}) => string} */ () => {
	return `オープンチャット作成`
};

export const boardtabfree2 = /** @type {(inputs: {}) => string} */ () => {
	return `自由討論`
};

export const boardtabqna2 = /** @type {(inputs: {}) => string} */ () => {
	return `質問と回答`
};

export const boardtabmarket2 = /** @type {(inputs: {}) => string} */ () => {
	return `会員マーケット`
};

export const boardwritepost2 = /** @type {(inputs: {}) => string} */ () => {
	return `投稿を書く`
};

export const sidebarupcomingtodos2 = /** @type {(inputs: {}) => string} */ () => {
	return `予定中のTODO`
};

export const sidebartodochatinvites3 = /** @type {(inputs: {}) => string} */ () => {
	return `チャット招待の承認/拒否`
};

export const sidebartodochatinvitesdesc4 = /** @type {(inputs: {}) => string} */ () => {
	return `チャット一覧の上部に招待を表示し、入室前に参加するか確認します。`
};

export const sidebartodoposttype3 = /** @type {(inputs: {}) => string} */ () => {
	return `掲示板ポスト型メッセージ`
};

export const sidebartodoposttypedesc4 = /** @type {(inputs: {}) => string} */ () => {
	return `カテゴリ・タイトル・コメントUIを備えた掲示板スタイルの投稿作成を準備します。`
};

export const sidebartodoboardstats3 = /** @type {(inputs: {}) => string} */ () => {
	return `掲示板統計カード`
};

export const sidebartodoboardstatsdesc4 = /** @type {(inputs: {}) => string} */ () => {
	return `投稿/コメント/いいね数をリアルタイムで表示します。`
};

export const homesectionrecentusers3 = /** @type {(inputs: {}) => string} */ () => {
	return `最近のユーザー`
};

export const homesectionrecentusersdesc4 = /** @type {(inputs: {}) => string} */ () => {
	return `新しく参加したユーザーをここで確認できるようにします。`
};

export const homesectionrecentopenchat4 = /** @type {(inputs: {}) => string} */ () => {
	return `最近のオープンチャットメッセージ`
};

export const homesectionrecentopenchatdesc5 = /** @type {(inputs: {}) => string} */ () => {
	return `リアルタイムのオープンチャットをこの領域に表示予定です。`
};

export const homesectionrecentopenchatempty5 = /** @type {(inputs: {}) => string} */ () => {
	return `最近のオープンチャットメッセージはありません。`
};

export const homesectionrecentopenchatlogin5 = /** @type {(inputs: {}) => string} */ () => {
	return `ログインすると参加中のオープンチャットの最新メッセージを確認できます。`
};

export const homesectionpopularopenroom4 = /** @type {(inputs: {}) => string} */ () => {
	return `人気オープンチャットルーム`
};

export const homesectionpopularopenroomdesc5 = /** @type {(inputs: {}) => string} */ () => {
	return `参加者が多いルームをおすすめとして表示します。`
};

export const homesectionrecentposts3 = /** @type {(inputs: {}) => string} */ () => {
	return `最新の投稿＆コメント`
};

export const homesectionrecentpostsdesc4 = /** @type {(inputs: {}) => string} */ () => {
	return `掲示板の最新投稿とコメントをまとめて確認できるよう準備中です。`
};

export const homesectionrecentuserscount4 = /** @type {(inputs: { count: NonNullable<unknown> }) => string} */ (i) => {
	return `直近で参加したユーザー ${i.count}人`
};

export const homeopenchatnomessage4 = /** @type {(inputs: {}) => string} */ () => {
	return `まだメッセージがありません。`
};

export const sidebardevhighlightattachment3 = /** @type {(inputs: {}) => string} */ () => {
	return `9. 添付ファイルアップロード`
};

export const sidebardevhighlightpassword3 = /** @type {(inputs: {}) => string} */ () => {
	return `10. チャットパスワード機能`
};

export const sidebardevhighlightposttype4 = /** @type {(inputs: {}) => string} */ () => {
	return `11. Postタイプメッセージ`
};

export const sidebardevhighlightwrapup4 = /** @type {(inputs: {}) => string} */ () => {
	return `8. チャットルーム終了機能`
};

export const chatnomoremessages3 = /** @type {(inputs: {}) => string} */ () => {
	return `これ以上メッセージはありません。`
};

export const chatroomlist2 = /** @type {(inputs: {}) => string} */ () => {
	return `マイチャット`
};

export const chatroomlistempty3 = /** @type {(inputs: {}) => string} */ () => {
	return `参加しているチャットルームがありません。`
};

export const chatroomlistloading3 = /** @type {(inputs: {}) => string} */ () => {
	return `チャットルーム読み込み中...`
};

export const chatpasswordsaving2 = /** @type {(inputs: {}) => string} */ () => {
	return `保存中...`
};

export const chatpasswordenabletoggle3 = /** @type {(inputs: {}) => string} */ () => {
	return `パスワードを有効にする`
};

export const chatpasswordinputplaceholder3 = /** @type {(inputs: {}) => string} */ () => {
	return `パスワード（最低4文字）`
};

export const chatpasswordconfirmplaceholder3 = /** @type {(inputs: {}) => string} */ () => {
	return `パスワード確認`
};

export const chatpasswordminlengtherror4 = /** @type {(inputs: {}) => string} */ () => {
	return `パスワードは最低4文字以上でなければなりません`
};

export const chatpasswordmismatcherror3 = /** @type {(inputs: {}) => string} */ () => {
	return `パスワードが一致しません`
};

export const chatpasswordsetsuccess3 = /** @type {(inputs: {}) => string} */ () => {
	return `パスワードが設定されました`
};

export const chatpasswordremovesuccess3 = /** @type {(inputs: {}) => string} */ () => {
	return `パスワードが解除されました`
};

export const chatpasswordsavefailure3 = /** @type {(inputs: {}) => string} */ () => {
	return `パスワードの保存に失敗しました`
};

export const chatpasswordsettings2 = /** @type {(inputs: {}) => string} */ () => {
	return `パスワード設定`
};

export const chatpasswordrequired2 = /** @type {(inputs: {}) => string} */ () => {
	return `このチャットルームはパスワードが必要です。`
};

export const chatpasswordenterprompt3 = /** @type {(inputs: {}) => string} */ () => {
	return `パスワードを入力してください`
};

export const chatpasswordverifying2 = /** @type {(inputs: { countdown: NonNullable<unknown> }) => string} */ (i) => {
	return `検証中...（残り${i.countdown}秒）`
};

export const chatpasswordverifysuccess3 = /** @type {(inputs: {}) => string} */ () => {
	return `パスワードが確認されました`
};

export const chatpasswordincorrect2 = /** @type {(inputs: {}) => string} */ () => {
	return `パスワードが正しくありません`
};

export const chatpasswordverifyfailure3 = /** @type {(inputs: {}) => string} */ () => {
	return `パスワード検証に失敗しました`
};

export const chatpassworddelete2 = /** @type {(inputs: {}) => string} */ () => {
	return `パスワード削除`
};

export const chatpassworddeletesuccess3 = /** @type {(inputs: {}) => string} */ () => {
	return `パスワードが削除されました`
};
export { chataccept1 } from "./en.js"
export { chatreject1 } from "./en.js"
export { chatinvitefriend2 } from "./en.js"
export { chatinvitetoroom3 } from "./en.js"
export { chatsearchusertoinvite4 } from "./en.js"
export { chatinvitationsent2 } from "./en.js"

export const chatdirectchat2 = /** @type {(inputs: {}) => string} */ () => {
	return `ダイレクトチャット`
};
export { loading } from "./en.js"
export { close } from "./en.js"
export { save } from "./en.js"
export { _delete } from "./en.js"
export { cancel } from "./en.js"
export { confirm } from "./en.js"
export { refresh } from "./en.js"
export { retry } from "./en.js"
export { info } from "./en.js"
export { status } from "./en.js"
export { success } from "./en.js"
export { error } from "./en.js"
export { complete } from "./en.js"
export { progress } from "./en.js"
export { go } from "./en.js"
export { user } from "./en.js"
export { home } from "./en.js"
export { about } from "./en.js"
export { products } from "./en.js"
export { contact } from "./en.js"
export { board } from "./en.js"
export { chat } from "./en.js"
export { findusers1 } from "./en.js"
export { signin1 } from "./en.js"
export { signout1 } from "./en.js"
export { menu } from "./en.js"
export { myprofile1 } from "./en.js"
export { profilenicknamelengthlimit3 } from "./en.js"
export { profilegendernotspecified3 } from "./en.js"
export { profilebirthdate1 } from "./en.js"
export { profilebirthdateyear2 } from "./en.js"
export { profilebirthdatemonth2 } from "./en.js"
export { profilebirthdateday2 } from "./en.js"
export { profileyearformat2 } from "./en.js"
export { profilemonthformat2 } from "./en.js"
export { profiledayformat2 } from "./en.js"
export { profilebirthdatefutureerror3 } from "./en.js"
export { profilebirthdateagelimit3 } from "./en.js"
export { profilephoto1 } from "./en.js"
export { profilephotouploadguide3 } from "./en.js"
export { profilephotouploadsuccess3 } from "./en.js"
export { profilephotouploadfailed3 } from "./en.js"
export { profilephotoremove2 } from "./en.js"
export { profilephotoremovesuccess3 } from "./en.js"
export { profilephotoremovefailed3 } from "./en.js"
export { profilephototypeerror3 } from "./en.js"
export { profilephotosizeerror3 } from "./en.js"
export { profilememberinfo2 } from "./en.js"
export { profilememberinfoguide3 } from "./en.js"
export { profilememberinfoeditguide4 } from "./en.js"
export { userjoineddate2 } from "./en.js"
export { usernoregistration2 } from "./en.js"
export { usernosignup2 } from "./en.js"
export { testusercreatebatchcount4 } from "./en.js"
export { testusercurrentcreatecount4 } from "./en.js"
export { testusernoneguide3 } from "./en.js"
export { testuserinfounrecoverable3 } from "./en.js"
export { underconstruction1 } from "./en.js"
export { underconstructionmessage2 } from "./en.js"
export { underconstructionbacktohome4 } from "./en.js"
export { boardunderconstruction2 } from "./en.js"
export { chatunderconstruction2 } from "./en.js"
export { sidebarlanguage1 } from "./en.js"
export { pagetitlesignin3 } from "./en.js"
export { pagemetasignin3 } from "./en.js"
export { profilephotouploadpreview3 } from "./en.js"
export { testusernodelete3 } from "./en.js"
export { testusercreateunit3 } from "./en.js"
export { authdescription1 } from "./en.js"
export { authsignin2 } from "./en.js"
export { profileuserinfo2 } from "./en.js"
export { profileuserinfoguide3 } from "./en.js"
export { usernousersregistered3 } from "./en.js"
export { usernosignedup3 } from "./en.js"
export { testusercreatedatonce4 } from "./en.js"
export { testuserdeletingprogress3 } from "./en.js"
export { testusernousersguide4 } from "./en.js"
export { testuseryear2 } from "./en.js"
export { constructionunderconstruction2 } from "./en.js"
export { featuresveltekit52 } from "./en.js"
export { featuretailwindcss4 } from "./en.js"
export { testuserdeleteconfirmation3 } from "./en.js"
export { testusernouserstodelete5 } from "./en.js"
export { testuserdeleteallconfirmation4 } from "./en.js"
export { testuserprogressindicator3 } from "./en.js"
```

