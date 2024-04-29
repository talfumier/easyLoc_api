USE master;
GO
IF EXISTS(SELECT name FROM sys.databases WHERE name='easyLoc')
	ALTER DATABASE easyLoc SET single_user WITH ROLLBACK IMMEDIATE; --close connections to easyLoc if any
GO
DROP DATABASE IF EXISTS easyLoc;
GO
CREATE DATABASE easyLoc;
GO
USE easyLoc;
GO
IF NOT EXISTS(SELECT loginname FROM master.dbo.sysLogins WHERE loginname='user1')
	BEGIN 
	    CREATE LOGIN user1 WITH PASSWORD='Epsi2024';
	END
GO
IF NOT EXISTS(SELECT name FROM sys.database_principals WHERE name='user1')
	CREATE USER user1 FOR LOGIN user1;
GO
ALTER ROLE [db_owner] ADD MEMBER [user1]
GO

SELECT GETDATE() 
