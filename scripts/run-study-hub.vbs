Option Explicit
Dim shell, fs, root, node, command, result
Set shell = CreateObject("WScript.Shell")
Set fs = CreateObject("Scripting.FileSystemObject")
root = fs.GetParentFolderName(fs.GetParentFolderName(WScript.ScriptFullName))
If WScript.Arguments.Count <> 1 Then WScript.Quit 2
node = WScript.Arguments(0)
shell.CurrentDirectory = root
command = Chr(34) & node & Chr(34) & " " & Chr(34) & root & "\server\supervisor.mjs" & Chr(34)
result = shell.Run(command, 0, True)
WScript.Quit result
